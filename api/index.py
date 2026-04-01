import os
import sys

# Add the root directory to the sys.path so 'auralis' package can be found
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from auralis.server.app import app
