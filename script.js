"use strict";
const $ = (id) => document.getElementById(id);
function number(id){
    const value = Number($(id).value);
    return Number.isFinite(value) ? value : 0;
}
function format(value, digits = 2){
    if (!Number.isFinite(value)) return "-";
    return new Intl.NumberFormat("pl-PL", {
        minimumFractionDigits: digits,
        maximumFractionDigits: digits
    }).format(value);
}
function calculateTakt() {
      const demand = number("demand");
      const days = number("days1");
      const shifts = number("shifts1");
      const hours = number("hours1");
      const oee = number("oee1") / 100;

      const sumWorkhours = shifts * hours;
      const effectiveHours = days * shifts * hours * oee;
      const nominalHours = days * shifts * hours;
      const ctLimitSec = demand > 0 ? effectiveHours * 3600 / demand : NaN;
      const taktNominal = demand > 0 ? nominalHours * 3600 / demand : NaN;
      $("sumWorkhours1").textContent = `${format(sumWorkhours)} h/dzień`;
      $("effectiveHours1").textContent = `${format(effectiveHours)} h/rok`;
      $("ctLimitSec").textContent = `${format(ctLimitSec)} s/szt.`;
      $("ctLimitMin").textContent = `${format(ctLimitSec / 60)} min/szt.`;
      $("taktNominal").textContent = `${format(taktNominal)} s/szt.`;
    }
function calculateCapacity() {
      const ct = number("ct");
      const days = number("days2");
      const shifts = number("shifts2");
      const hours = number("hours2");
      const oee = number("oee2") / 100;

      const effectiveHours = days * shifts * hours * oee;
      const production = ct > 0 ? effectiveHours * 3600 / ct : NaN;
      const daily = days > 0 ? production / days : NaN;
      const perShift = (days > 0 && shifts > 0) ? production / days / shifts : NaN;
      const effectiveCt = oee > 0 && ct > 0 ? ct / oee : NaN;

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
document.querySelectorAll("input").forEach((input) => {
    input.addEventListener("input", calculateAll);
});
calculateAll();