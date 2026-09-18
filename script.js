(() => {
    "use strict";

    const STORAGE_KEY = "takt-ct-calculator.form.v1";
    const SHARE_PARAM = "data";

    const FIELD_IDS = [
        "demand",
        "days1",
        "shifts1",
        "hours1",
        "oee1",
        "ct",
        "days2",
        "shifts2",
        "hours2",
        "oee2"
    ];

    const DEFAULTS = Object.freeze({
        demand: "10000",
        days1: "251",
        shifts1: "3",
        hours1: "7.5",
        oee1: "85",
        ct: "6",
        days2: "251",
        shifts2: "3",
        hours2: "7.5",
        oee2: "85"
    });

    const $ = (id) => document.getElementById(id);
    
    function readNumber(id) {
        const value = Number($(id).value);
        return Number.isFinite(value) ? value : 0;
    }
    
    function format(value, digits = 2) {
        if (!Number.isFinite(value)) {
            return "-";
        }

        return new Intl.NumberFormat("pl-PL", {
            minimumFractionDigits: digits,
            maximumFractionDigits: digits
        }).format(value);
    }

    function calculateTakt() {
        const demand = readNumber("demand");
        const days = readNumber("days1");
        const shifts = readNumber("shifts1");
        const hours = readNumber("hours1");
        const oee = readNumber("oee1") / 100;

        const workHoursPerDay = shifts * hours;
        const effectiveHours = days * shifts * hours * oee;
        const nominalHours = days * shifts * hours;
        const ctLimitSec = demand > 0 ? effectiveHours * 3600 / demand : NaN;
        const taktNominal = demand > 0 ? nominalHours * 3600 / demand : NaN;

        $("sumWorkhours1").textContent = `${format(workHoursPerDay)} h/dzień`;
        $("effectiveHours1").textContent = `${format(effectiveHours)} h/rok`;
        $("ctLimitSec").textContent = `${format(ctLimitSec)} s/szt.`;
        $("ctLimitMin").textContent = `${format(ctLimitSec / 60)} min/szt.`;
        $("taktNominal").textContent = `${format(taktNominal)} s/szt.`;
    }

    function calculateCapacity() {
        const ct = readNumber("ct");
        const days = readNumber("days2");
        const shifts = readNumber("shifts2");
        const hours = readNumber("hours2");
        const oee = readNumber("oee2") / 100;

        const workHoursPerDay = shifts * hours;
        const effectiveHours = days * shifts * hours * oee;
        const production = ct > 0 ? effectiveHours * 3600 / ct : NaN;
        const daily = days > 0 ? production / days : NaN;
        const perShift = (days > 0 && shifts > 0) ? production / days / shifts : NaN;
        const effectiveCt = oee > 0 && ct > 0 ? ct / oee : NaN;

        $("sumWorkhours2").textContent = `${format(workHoursPerDay)} h/dzień`;
        $("effectiveHours2").textContent = `${format(effectiveHours)} h/rok`;
        $("annualProduction").textContent = Number.isFinite(production)
            ? `${Math.floor(production).toLocaleString("pl-PL")} szt./rok`
            : "—";
        $("dailyProduction").textContent = `${format(daily, 1)} szt./dzień`;
        $("shiftProduction").textContent = `${format(perShift, 1)} szt./zmianę`;
        $("effectiveCt").textContent = `${format(effectiveCt)} s/szt.`;
    }
    
    function calculateAll() {
        calculateTakt();
        calculateCapacity();
    }

    function getFormState() {
        return Object.fromEntries(
            FIELD_IDS.map((id) => [id, $(id).value])
        );
    }

    function applyFormState(state) {
        for (const id of FIELD_IDS) {
            if (typeof state[id] === "string") {
                $(id).value = state[id];
            }
        }
    }

    function saveFormState() {
        try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(getFormState()));
        } catch {
            // Private browsing / disabled storage should not break calculations.
        }
    }

    function loadLocalState() {
        try {
            const raw = localStorage.getItem(STORAGE_KEY);
            if (!raw) {
                return null;
            }

            const parsed = JSON.parse(raw);
            if (!parsed || typeof parsed !== "object") {
                return null;
            }

            return parsed;
        } catch {
            return null;
        }
    }

    function base64UrlEncode(value) {
        const bytes = new TextEncoder().encode(value);
        let binary = "";

        for (const byte of bytes) {
            binary += String.fromCharCode(byte);
        }

        return btoa(binary)
            .replace(/\+/g, "-")
            .replace(/\//g, "_")
            .replace(/=+$/g, "");
    }

    function base64UrlDecode(value) {
        const normalized = value
            .replace(/-/g, "+")
            .replace(/_/g, "/")
            .padEnd(value.length + (4 - value.length % 4) % 4, "=");

        const binary = atob(normalized);
        const bytes = Uint8Array.from(binary, (character) => character.charCodeAt(0));

        return new TextDecoder().decode(bytes);
    }

    function encodeShareState(state) {
        const compactState = FIELD_IDS.map((id) => state[id] ?? "");
        return base64UrlEncode(JSON.stringify(compactState));
    }

    function decodeShareState(value) {
        try {
            const decoded = JSON.parse(base64UrlDecode(value));

            if (!Array.isArray(decoded) || decoded.length !== FIELD_IDS.length) {
                return null;
            }

            return Object.fromEntries(
                FIELD_IDS.map((id, index) => [id, String(decoded[index] ?? "")])
            );
        } catch {
            return null;
        }
    }

    function buildShareUrl() {
        const url = new URL(window.location.href);
        url.search = "";
        url.hash = `${SHARE_PARAM}=${encodeShareState(getFormState())}`;
        return url.toString();
    }
    
    function getSharedStateFromUrl() {
        const hash = window.location.hash.replace(/^#/, "");
        const params = new URLSearchParams(hash);
        const encodedState = params.get(SHARE_PARAM);

        return encodedState ? decodeShareState(encodedState) : null;
    }

    function showStatus(message) {
        const status = $("shareStatus");
        status.textContent = message;
        status.classList.add("share-status--visible");

        window.clearTimeout(showStatus.timeoutId);
        showStatus.timeoutId = window.setTimeout(() => {
            status.classList.remove("share-status--visible");
        }, 3000);
    }

    async function copyText(text) {
        if (navigator.clipboard?.writeText) {
            await navigator.clipboard.writeText(text);
            return;
        }

        const temporaryInput = document.createElement("textarea");
        temporaryInput.value = text;
        temporaryInput.setAttribute("readonly", "");
        temporaryInput.style.position = "fixed";
        temporaryInput.style.opacity = "0";
        document.body.appendChild(temporaryInput);
        temporaryInput.select();

        const copied = document.execCommand("copy");
        temporaryInput.remove();

        if (!copied) {
            throw new Error("Nie udało się skopiować tekstu.");
        }
    }

    async function shareConfiguration() {
        const url = buildShareUrl();

        try {
            if (navigator.share) {
                await navigator.share({
                    title: document.title,
                    text: "Konfiguracja kalkulatora TAKT / CT",
                    url
                });
                return;
            }

            await copyText(url);
            showStatus("Link został skopiowany do schowka.");
        } catch (error) {
            if (error?.name !== "AbortError") {
                showStatus("Nie udało się udostępnić konfiguracji.");
            }
        }
    }

    function showQrDialog() {
        const url = buildShareUrl();
        const qrContainer = $("qrCode");

        qrContainer.replaceChildren();
        $("shareUrl").value = url;

        if (typeof QRCode === "undefined") {
            qrContainer.textContent = "Biblioteka QR nie została załadowana.";
        } else {
            new QRCode(qrContainer, {
                text: url,
                width: 240,
                height: 240,
                correctLevel: QRCode.CorrectLevel.M
            });
        }

        $("qrDialog").showModal();
    }

    function closeQrDialog() {
        $("qrDialog").close();
    }

    function initializeForm() {
        const sharedState = getSharedStateFromUrl();
        const localState = loadLocalState();

        applyFormState(sharedState ?? localState ?? DEFAULTS);
        saveFormState();
        calculateAll();
    }

    function initializeEvents() {
        document.querySelectorAll("input[type='number']").forEach((input) => {
            input.addEventListener("input", () => {
                saveFormState();
                calculateAll();
            });
        });

        $("shareButton").addEventListener("click", shareConfiguration);
        $("qrButton").addEventListener("click", showQrDialog);
        $("closeQrButton").addEventListener("click", closeQrDialog);

        $("copyLinkButton").addEventListener("click", async () => {
            try {
                await copyText($("shareUrl").value);
                showStatus("Link został skopiowany do schowka.");
            } catch {
                showStatus("Nie udało się skopiować linku.");
            }
        });

        $("qrDialog").addEventListener("click", (event) => {
            if (event.target === $("qrDialog")) {
                closeQrDialog();
            }
        });
    }

    initializeForm();
    initializeEvents();
})();
