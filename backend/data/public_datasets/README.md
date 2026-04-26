# Public Dataset Adapters

Ghost Beam can analyze local slices of public accelerator-control datasets without changing the live synthetic JAX-twin demo.

## BOOSTR

BOOSTR is a public Fermilab Booster accelerator-control dataset suitable for control-systems ML, anomaly detection, and replay-style analysis.

- Dataset: `BOOSTR: A Dataset for Accelerator Control Systems`
- DOI: `10.5281/zenodo.4382663`
- License: `CC BY 4.0`
- Adapter status: local read-only import path

Ghost Beam does not auto-download the full BOOSTR dataset and does not bundle the dataset. To use this adapter, place a small CSV or Parquet slice under:

```text
backend/data/public_datasets/boostr/
```

Suggested default local path:

```text
backend/data/public_datasets/boostr/local_sample.csv
```

Expected slice contents:

- a timestamp-like column if available
- multiple numeric accelerator-control or readback signals
- optional event/anomaly labels

The importer inspects columns, detects numeric signals, records timestamp range when possible, and creates a read-only public-data run. Public Data Mode can evaluate a window for simple anomaly/trust metrics, but it never mutates the active experiment and never enables hardware actions.

## Fermilab BPM/IPM

The Fermilab BPM/IPM Booster diagnostics dataset is tracked as a manifest-ready public diagnostics source.

- DOI: `10.5281/zenodo.17429707`
- Role: beam-position/profile diagnostics and emittance-comparison context
- Adapter status: manifest ready
- Files bundled: none
- Hardware writes: none

A future local-slice importer can live under:

```text
backend/data/public_datasets/fermilab_bpm_ipm/
```

It should remain read-only and separate from the live synthetic JAX demo.

## Testing Without BOOSTR

For UI testing only, you may generate a tiny BOOSTR-shaped synthetic sample:

```powershell
python backend/scripts/create_boostr_shaped_sample.py
```

That sample is not actual BOOSTR data. It is a small local fixture that only exercises the importer.
