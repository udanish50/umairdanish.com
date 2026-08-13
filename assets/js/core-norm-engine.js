(function (global) {
  'use strict';

  const finite = (x) => Number.isFinite(x);
  const valid = (x) => x === null || finite(x);

  function quantile(values, q) {
    const a = values.filter(finite).slice().sort((x, y) => x - y);
    if (!a.length) return NaN;
    if (a.length === 1) return a[0];
    const pos = (a.length - 1) * q;
    const lo = Math.floor(pos), hi = Math.ceil(pos), t = pos - lo;
    return a[lo] * (1 - t) + a[hi] * t;
  }

  function median(values) { return quantile(values, 0.5); }

  class CoreNormEngine {
    constructor({q = 0.95, tauMin = 1.5, tauMax = 3.0, eps = 1e-8} = {}) {
      if (!(q > 0.5 && q < 1)) throw new Error('q must be between 0.5 and 1.');
      if (!(tauMin > 0 && tauMax >= tauMin)) throw new Error('Invalid transition bounds.');
      if (!(eps > 0)) throw new Error('eps must be positive.');
      this.q = q; this.tauMin = tauMin; this.tauMax = tauMax; this.eps = eps;
      this.fitted = false;
    }

    fit(matrix) {
      if (!Array.isArray(matrix) || !matrix.length || !Array.isArray(matrix[0])) throw new Error('Expected a non-empty 2-D numeric matrix.');
      const p = matrix[0].length;
      if (!p || matrix.some(r => !Array.isArray(r) || r.length !== p || r.some(v => !valid(v)))) throw new Error('Matrix rows must have equal width and contain finite numbers or missing values.');
      this.p = p; this.median = []; this.lower = []; this.upper = []; this.tau = [];
      for (let j = 0; j < p; j++) {
        const col = matrix.map(r => r[j]).filter(finite);
        if (!col.length) throw new Error(`Column ${j + 1} contains no finite values.`);
        const m = median(col), q25 = quantile(col, 0.25), q75 = quantile(col, 0.75);
        const mad = median(col.map(v => Math.abs(v - m)));
        const fallback = mad > this.eps ? mad : 1.0;
        const left = m - q25, right = q75 - m;
        this.median.push(m);
        this.lower.push(left > this.eps ? left : fallback);
        this.upper.push(right > this.eps ? right : fallback);
      }
      const ucols = Array.from({length: p}, () => []);
      for (const row of matrix) {
        const u = this._standardizeRow(row);
        for (let j = 0; j < p; j++) if (finite(u[j])) ucols[j].push(Math.abs(u[j]));
      }
      for (let j = 0; j < p; j++) {
        const candidate = quantile(ucols[j], this.q);
        this.tau.push(Math.min(this.tauMax, Math.max(this.tauMin, finite(candidate) ? candidate : this.tauMin)));
      }
      this.fitted = true;
      return this;
    }

    _check() { if (!this.fitted && !this.tau) throw new Error('Core-Norm is not fitted.'); }

    _standardizeRow(row) {
      return row.map((x, j) => {
        if (!finite(x)) return null;
        const scale = x < this.median[j] ? this.lower[j] : this.upper[j];
        return (x - this.median[j]) / (scale + this.eps);
      });
    }

    transformRow(row) {
      this._check();
      if (!Array.isArray(row) || row.length !== this.p) throw new Error('Wrong feature count.');
      const u = this._standardizeRow(row), central = [], residual = [];
      for (let j = 0; j < this.p; j++) {
        if (!finite(u[j])) { central.push(null); residual.push(null); continue; }
        central.push(Math.max(-1, Math.min(1, u[j] / this.tau[j])));
        const d = Math.max(Math.abs(u[j]) - this.tau[j], 0);
        const a = Math.log1p(d);
        residual.push(Math.sign(u[j]) * a / (1 + a));
      }
      return central.concat(residual);
    }

    transform(matrix) { return matrix.map(r => this.transformRow(r)); }

    inverseRow(z) {
      this._check();
      if (!Array.isArray(z) || z.length !== 2 * this.p) throw new Error('Encoded row has the wrong width.');
      const out = [];
      for (let j = 0; j < this.p; j++) {
        const c = z[j], r = z[this.p + j];
        if (!finite(c) || !finite(r)) { out.push(null); continue; }
        if (Math.abs(c) > 1 + 1e-12 || Math.abs(r) >= 1) throw new Error('Invalid Core-Norm coordinates.');
        let u;
        if (r === 0) {
          u = this.tau[j] * c;
        } else {
          const e = Math.abs(r);
          const a = e / (1 - e);
          const d = Math.expm1(a);
          u = Math.sign(r) * (this.tau[j] + d);
        }
        const scale = u < 0 ? this.lower[j] : this.upper[j];
        out.push(this.median[j] + u * (scale + this.eps));
      }
      return out;
    }

    inverse(matrix) { return matrix.map(r => this.inverseRow(r)); }

    state(featureNames = null) {
      this._check();
      return {
        schema_version: 1,
        method: 'Core-Norm',
        params: {q: this.q, tau_min: this.tauMin, tau_max: this.tauMax, eps: this.eps},
        feature_names: featureNames,
        median: this.median,
        scale_lower: this.lower,
        scale_upper: this.upper,
        tau: this.tau
      };
    }
  }

  global.CoreNormEngine = CoreNormEngine;
  if (typeof module !== 'undefined' && module.exports) module.exports = {CoreNormEngine, quantile};
})(typeof window !== 'undefined' ? window : globalThis);
