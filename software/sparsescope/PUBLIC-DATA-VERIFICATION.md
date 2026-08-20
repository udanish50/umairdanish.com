# Public-data verification

**Status: 64 / 64 public datasets passed.**

Each dataset is converted to a reproducible numeric matrix view (up to 12 rows × 12 columns). For each sample the JavaScript engine is checked against precomputed NumPy reference results for A×Aᵀ, transpose/shape, sparsity, cell trace, row normalization, memory-model invariants, and structural analysis.

The browser sample is intentionally small for instant interaction. Every card links back to the public source/documentation. Image datasets are represented as numeric pixel matrices; classic graph datasets are represented as adjacency matrices.

### Coverage

- statsmodels: 28 public packaged datasets
- scikit-learn: 8 public packaged datasets / sample images
- scikit-image: 24 bundled public reference images/data
- NetworkX: 4 classic public social-network datasets

| Dataset | Provider | Numeric/full shape | Browser sample | Source |
|---|---|---:|---:|---|
| Davis Southern Women | NetworkX | 32×32 | 12×12 | [source](https://networkx.org/documentation/stable/reference/generated/networkx.generators.social.davis_southern_women_graph.html) |
| Florentine Families | NetworkX | 15×15 | 12×12 | [source](https://networkx.org/documentation/stable/reference/generated/networkx.generators.social.florentine_families_graph.html) |
| Les Misérables Coappearance | NetworkX | 77×77 | 12×12 | [source](https://networkx.org/documentation/stable/reference/generated/networkx.generators.social.les_miserables_graph.html) |
| Zachary Karate Club | NetworkX | 34×34 | 12×12 | [source](https://networkx.org/documentation/stable/reference/generated/networkx.generators.social.karate_club_graph.html) |
| Astronaut | scikit-image | 512×512 | 12×12 | [source](https://scikit-image.org/docs/stable/api/skimage.data.html#skimage.data.astronaut) |
| Brick | scikit-image | 512×512 | 12×12 | [source](https://scikit-image.org/docs/stable/api/skimage.data.html#skimage.data.brick) |
| Camera | scikit-image | 512×512 | 12×12 | [source](https://scikit-image.org/docs/stable/api/skimage.data.html#skimage.data.camera) |
| Cat | scikit-image | 300×451 | 12×12 | [source](https://scikit-image.org/docs/stable/api/skimage.data.html#skimage.data.cat) |
| Cell | scikit-image | 660×550 | 12×12 | [source](https://scikit-image.org/docs/stable/api/skimage.data.html#skimage.data.cell) |
| Checkerboard | scikit-image | 200×200 | 12×12 | [source](https://scikit-image.org/docs/stable/api/skimage.data.html#skimage.data.checkerboard) |
| Chelsea | scikit-image | 300×451 | 12×12 | [source](https://scikit-image.org/docs/stable/api/skimage.data.html#skimage.data.chelsea) |
| Clock | scikit-image | 300×400 | 12×12 | [source](https://scikit-image.org/docs/stable/api/skimage.data.html#skimage.data.clock) |
| Coffee | scikit-image | 400×600 | 12×12 | [source](https://scikit-image.org/docs/stable/api/skimage.data.html#skimage.data.coffee) |
| Coins | scikit-image | 303×384 | 12×12 | [source](https://scikit-image.org/docs/stable/api/skimage.data.html#skimage.data.coins) |
| Colorwheel | scikit-image | 370×371 | 12×12 | [source](https://scikit-image.org/docs/stable/api/skimage.data.html#skimage.data.colorwheel) |
| Grass | scikit-image | 512×512 | 12×12 | [source](https://scikit-image.org/docs/stable/api/skimage.data.html#skimage.data.grass) |
| Gravel | scikit-image | 512×512 | 12×12 | [source](https://scikit-image.org/docs/stable/api/skimage.data.html#skimage.data.gravel) |
| Horse | scikit-image | 328×400 | 12×12 | [source](https://scikit-image.org/docs/stable/api/skimage.data.html#skimage.data.horse) |
| Hubble Deep Field | scikit-image | 872×1000 | 12×12 | [source](https://scikit-image.org/docs/stable/api/skimage.data.html#skimage.data.hubble_deep_field) |
| Immunohistochemistry | scikit-image | 512×512 | 12×12 | [source](https://scikit-image.org/docs/stable/api/skimage.data.html#skimage.data.immunohistochemistry) |
| Lfw Subset | scikit-image | 200×625 | 12×12 | [source](https://scikit-image.org/docs/stable/api/skimage.data.html#skimage.data.lfw_subset) |
| Logo | scikit-image | 500×500 | 12×12 | [source](https://scikit-image.org/docs/stable/api/skimage.data.html#skimage.data.logo) |
| Moon | scikit-image | 512×512 | 12×12 | [source](https://scikit-image.org/docs/stable/api/skimage.data.html#skimage.data.moon) |
| Page | scikit-image | 191×384 | 12×12 | [source](https://scikit-image.org/docs/stable/api/skimage.data.html#skimage.data.page) |
| Retina | scikit-image | 1411×1411 | 12×12 | [source](https://scikit-image.org/docs/stable/api/skimage.data.html#skimage.data.retina) |
| Rocket | scikit-image | 427×640 | 12×12 | [source](https://scikit-image.org/docs/stable/api/skimage.data.html#skimage.data.rocket) |
| Shepp Logan Phantom | scikit-image | 400×400 | 12×12 | [source](https://scikit-image.org/docs/stable/api/skimage.data.html#skimage.data.shepp_logan_phantom) |
| Text | scikit-image | 172×448 | 12×12 | [source](https://scikit-image.org/docs/stable/api/skimage.data.html#skimage.data.text) |
| Breast Cancer Wisconsin | scikit-learn | 569×30 | 12×12 | [source](https://scikit-learn.org/stable/modules/generated/sklearn.datasets.load_breast_cancer.html) |
| Diabetes | scikit-learn | 442×10 | 12×10 | [source](https://scikit-learn.org/stable/modules/generated/sklearn.datasets.load_diabetes.html) |
| Digits | scikit-learn | 1797×64 | 12×12 | [source](https://scikit-learn.org/stable/modules/generated/sklearn.datasets.load_digits.html) |
| Iris | scikit-learn | 150×4 | 12×4 | [source](https://scikit-learn.org/stable/modules/generated/sklearn.datasets.load_iris.html) |
| Linnerud | scikit-learn | 20×3 | 12×3 | [source](https://scikit-learn.org/stable/modules/generated/sklearn.datasets.load_linnerud.html) |
| Sample Image — China | scikit-learn | 427×640 | 12×12 | [source](https://scikit-learn.org/stable/modules/generated/sklearn.datasets.load_sample_images.html) |
| Sample Image — Flower | scikit-learn | 427×640 | 12×12 | [source](https://scikit-learn.org/stable/modules/generated/sklearn.datasets.load_sample_images.html) |
| Wine | scikit-learn | 178×13 | 12×12 | [source](https://scikit-learn.org/stable/modules/generated/sklearn.datasets.load_wine.html) |
| Anes96 | statsmodels | 944×11 | 12×11 | [source](https://www.statsmodels.org/stable/datasets/generated/anes96.html) |
| Cancer | statsmodels | 301×2 | 12×2 | [source](https://www.statsmodels.org/stable/datasets/generated/cancer.html) |
| Ccard | statsmodels | 72×5 | 12×5 | [source](https://www.statsmodels.org/stable/datasets/generated/ccard.html) |
| China Smoking | statsmodels | 8×4 | 8×4 | [source](https://www.statsmodels.org/stable/datasets/generated/china_smoking.html) |
| Co2 | statsmodels | 2225×1 | 12×1 | [source](https://www.statsmodels.org/stable/datasets/generated/co2.html) |
| Committee | statsmodels | 20×6 | 12×6 | [source](https://www.statsmodels.org/stable/datasets/generated/committee.html) |
| Copper | statsmodels | 25×6 | 12×6 | [source](https://www.statsmodels.org/stable/datasets/generated/copper.html) |
| Cpunish | statsmodels | 17×7 | 12×7 | [source](https://www.statsmodels.org/stable/datasets/generated/cpunish.html) |
| Danish Data | statsmodels | 55×5 | 12×5 | [source](https://www.statsmodels.org/stable/datasets/generated/danish_data.html) |
| Elnino | statsmodels | 61×13 | 12×12 | [source](https://www.statsmodels.org/stable/datasets/generated/elnino.html) |
| Engel | statsmodels | 235×2 | 12×2 | [source](https://www.statsmodels.org/stable/datasets/generated/engel.html) |
| Fair | statsmodels | 6366×9 | 12×9 | [source](https://www.statsmodels.org/stable/datasets/generated/fair.html) |
| Fertility | statsmodels | 192×52 | 12×12 | [source](https://www.statsmodels.org/stable/datasets/generated/fertility.html) |
| Grunfeld | statsmodels | 220×4 | 12×4 | [source](https://www.statsmodels.org/stable/datasets/generated/grunfeld.html) |
| Heart | statsmodels | 69×3 | 12×3 | [source](https://www.statsmodels.org/stable/datasets/generated/heart.html) |
| Interest Inflation | statsmodels | 107×4 | 12×4 | [source](https://www.statsmodels.org/stable/datasets/generated/interest_inflation.html) |
| Longley | statsmodels | 16×7 | 12×7 | [source](https://www.statsmodels.org/stable/datasets/generated/longley.html) |
| Macrodata | statsmodels | 203×14 | 12×12 | [source](https://www.statsmodels.org/stable/datasets/generated/macrodata.html) |
| Modechoice | statsmodels | 840×9 | 12×9 | [source](https://www.statsmodels.org/stable/datasets/generated/modechoice.html) |
| Nile | statsmodels | 100×2 | 12×2 | [source](https://www.statsmodels.org/stable/datasets/generated/nile.html) |
| Randhie | statsmodels | 20190×10 | 12×10 | [source](https://www.statsmodels.org/stable/datasets/generated/randhie.html) |
| Scotland | statsmodels | 32×8 | 12×8 | [source](https://www.statsmodels.org/stable/datasets/generated/scotland.html) |
| Spector | statsmodels | 32×4 | 12×4 | [source](https://www.statsmodels.org/stable/datasets/generated/spector.html) |
| Stackloss | statsmodels | 21×4 | 12×4 | [source](https://www.statsmodels.org/stable/datasets/generated/stackloss.html) |
| Star98 | statsmodels | 303×22 | 12×12 | [source](https://www.statsmodels.org/stable/datasets/generated/star98.html) |
| Statecrime | statsmodels | 51×7 | 12×7 | [source](https://www.statsmodels.org/stable/datasets/generated/statecrime.html) |
| Strikes | statsmodels | 62×2 | 12×2 | [source](https://www.statsmodels.org/stable/datasets/generated/strikes.html) |
| Sunspots | statsmodels | 309×2 | 12×2 | [source](https://www.statsmodels.org/stable/datasets/generated/sunspots.html) |
