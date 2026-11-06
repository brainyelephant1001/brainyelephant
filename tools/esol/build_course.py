"""Compatibility entry point for the revision 3 curriculum builder."""
from pathlib import Path
import runpy,sys
folder=Path(__file__).resolve().parent/'curriculum'
sys.path.insert(0,str(folder))
runpy.run_path(str(folder/'build.py'),run_name='__main__')
