# Public-data verification

**Status: 34 / 34 public datasets passed.**

Each dataset is converted to a reproducible numeric sample (up to 12 rows × 12 numeric columns). For each sample the JavaScript engine is checked against precomputed NumPy reference results for A×Aᵀ, transpose/shape, sparsity, cell trace, row normalization, memory-model invariants, and structural analysis.

The bundled sample is intentionally small for instant browser interaction; the card links to the original dataset documentation/source.

| Dataset | Provider | Original shape | Browser sample | Source |
|---|---|---:|---:|---|
| Anes96 | statsmodels | 944×11 | 12×11 | [source](https://www.statsmodels.org/stable/datasets/generated/anes96.html) |
| Cancer | statsmodels | 301×2 | 12×2 | [source](https://www.statsmodels.org/stable/datasets/generated/cancer.html) |
| Ccard | statsmodels | 72×5 | 12×5 | [source](https://www.statsmodels.org/stable/datasets/generated/ccard.html) |
| Committee | statsmodels | 20×6 | 12×6 | [source](https://www.statsmodels.org/stable/datasets/generated/committee.html) |
| Copper | statsmodels | 25×6 | 12×6 | [source](https://www.statsmodels.org/stable/datasets/generated/copper.html) |
| Cpunish | statsmodels | 17×7 | 12×7 | [source](https://www.statsmodels.org/stable/datasets/generated/cpunish.html) |
| Elnino | statsmodels | 61×13 | 12×12 | [source](https://www.statsmodels.org/stable/datasets/generated/elnino.html) |
| Engel | statsmodels | 235×2 | 12×2 | [source](https://www.statsmodels.org/stable/datasets/generated/engel.html) |
| Fair | statsmodels | 6366×9 | 12×9 | [source](https://www.statsmodels.org/stable/datasets/generated/fair.html) |
| Fertility | statsmodels | 219×54 | 12×12 | [source](https://www.statsmodels.org/stable/datasets/generated/fertility.html) |
| Grunfeld | statsmodels | 220×4 | 12×4 | [source](https://www.statsmodels.org/stable/datasets/generated/grunfeld.html) |
| Heart | statsmodels | 69×3 | 12×3 | [source](https://www.statsmodels.org/stable/datasets/generated/heart.html) |
| Interest Inflation | statsmodels | 107×4 | 12×4 | [source](https://www.statsmodels.org/stable/datasets/generated/interest_inflation.html) |
| Longley | statsmodels | 16×7 | 12×7 | [source](https://www.statsmodels.org/stable/datasets/generated/longley.html) |
| Macrodata | statsmodels | 203×14 | 12×12 | [source](https://www.statsmodels.org/stable/datasets/generated/macrodata.html) |
| Nile | statsmodels | 100×2 | 12×2 | [source](https://www.statsmodels.org/stable/datasets/generated/nile.html) |
| Randhie | statsmodels | 20190×10 | 12×10 | [source](https://www.statsmodels.org/stable/datasets/generated/randhie.html) |
| Scotland | statsmodels | 32×8 | 12×8 | [source](https://www.statsmodels.org/stable/datasets/generated/scotland.html) |
| Spector | statsmodels | 32×4 | 12×4 | [source](https://www.statsmodels.org/stable/datasets/generated/spector.html) |
| Stackloss | statsmodels | 21×4 | 12×4 | [source](https://www.statsmodels.org/stable/datasets/generated/stackloss.html) |
| Star98 | statsmodels | 303×22 | 12×12 | [source](https://www.statsmodels.org/stable/datasets/generated/star98.html) |
| Statecrime | statsmodels | 51×7 | 12×7 | [source](https://www.statsmodels.org/stable/datasets/generated/statecrime.html) |
| Strikes | statsmodels | 62×2 | 12×2 | [source](https://www.statsmodels.org/stable/datasets/generated/strikes.html) |
| Sunspots | statsmodels | 309×2 | 12×2 | [source](https://www.statsmodels.org/stable/datasets/generated/sunspots.html) |
| Iris | scikit-learn | 150×4 | 12×4 | [source](https://scikit-learn.org/stable/datasets/toy_dataset.html#iris) |
| Wine | scikit-learn | 178×13 | 12×12 | [source](https://scikit-learn.org/stable/datasets/toy_dataset.html#wine) |
| Breast Cancer Wisconsin | scikit-learn | 569×30 | 12×12 | [source](https://scikit-learn.org/stable/datasets/toy_dataset.html#breast-cancer) |
| Diabetes | scikit-learn | 442×10 | 12×10 | [source](https://scikit-learn.org/stable/datasets/toy_dataset.html#diabetes) |
| Optical Digits | scikit-learn | 1797×64 | 12×12 | [source](https://scikit-learn.org/stable/datasets/toy_dataset.html#digits) |
| Linnerud Exercise | scikit-learn | 20×3 | 12×3 | [source](https://scikit-learn.org/stable/datasets/toy_dataset.html#linnerud) |
| Zachary Karate Club | NetworkX | 34×34 | 12×12 | [source](https://networkx.org/documentation/stable/reference/generated/networkx.generators.social.karate_club_graph.html) |
| Davis Southern Women | NetworkX | 32×32 | 12×12 | [source](https://networkx.org/documentation/stable/reference/generated/networkx.generators.social.davis_southern_women_graph.html) |
| Florentine Families | NetworkX | 15×15 | 12×12 | [source](https://networkx.org/documentation/stable/reference/generated/networkx.generators.social.florentine_families_graph.html) |
| Les Misérables Coappearance | NetworkX | 77×77 | 12×12 | [source](https://networkx.org/documentation/stable/reference/generated/networkx.generators.social.les_miserables_graph.html) |
