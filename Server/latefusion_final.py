"""Compatibility path for unpickling ``models/fusion_model.pkl``.

That artifact was saved as ``latefusion_final.PhysioDominantFusion``. The
implementation now lives in ``safespace/fusion.py``.
"""

from safespace.fusion import PhysioDominantFusion  # noqa: F401
