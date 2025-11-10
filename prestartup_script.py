"""
Prestartup script for comfy-ritya-tools.
This script runs before ComfyUI loads custom nodes, allowing us to install
mecha-ritya extension before comfy-mecha tries to load it.
"""
import os
import sys
import subprocess

# Add the parent directory to path to import logger
script_dir = os.path.dirname(os.path.abspath(__file__))
if script_dir not in sys.path:
    sys.path.insert(0, script_dir)

try:
    from logger import log_info, log_success, log_warning, log_error
except ImportError:
    # Fallback to simple print if logger is not available
    def log_info(msg): print(f"[comfy-ritya-tools] {msg}")
    def log_success(msg): print(f"[comfy-ritya-tools] ✓ {msg}")
    def log_warning(msg): print(f"[comfy-ritya-tools] ⚠ {msg}")
    def log_error(msg): print(f"[comfy-ritya-tools] ✗ {msg}", file=sys.stderr)


def check_and_update_mecha_ritya(mecha_ritya_path):
    """
    Checks for updates in mecha-ritya repository and pulls if available.
    """
    # Check if it's a git repository
    git_dir = os.path.join(mecha_ritya_path, ".git")
    if not os.path.exists(git_dir):
        log_warning("mecha-ritya is not a git repository. Skipping update check.")
        return
    
    try:
        # Get current branch name
        branch_result = subprocess.run(
            ["git", "rev-parse", "--abbrev-ref", "HEAD"],
            cwd=mecha_ritya_path,
            capture_output=True,
            text=True,
            timeout=10
        )
        
        if branch_result.returncode != 0:
            log_warning("Could not determine current branch. Skipping update check.")
            return
        
        current_branch = branch_result.stdout.strip()
        
        # Fetch latest changes from remote
        log_info("Checking for mecha-ritya updates...")
        fetch_result = subprocess.run(
            ["git", "fetch", "origin"],
            cwd=mecha_ritya_path,
            capture_output=True,
            text=True,
            timeout=30
        )
        
        if fetch_result.returncode != 0:
            log_error(f"Failed to fetch updates: {fetch_result.stderr.strip()}")
            return
        
        # Check if there are updates available
        # Compare local branch with remote branch
        remote_branch = f"origin/{current_branch}"
        check_result = subprocess.run(
            ["git", "rev-list", "--count", f"HEAD..{remote_branch}"],
            cwd=mecha_ritya_path,
            capture_output=True,
            text=True,
            timeout=10
        )
        
        if check_result.returncode == 0:
            commits_behind = check_result.stdout.strip()
            if commits_behind and int(commits_behind) > 0:
                log_info(f"Found {commits_behind} new commit(s). Updating mecha-ritya...")
                # Pull the latest changes
                pull_result = subprocess.run(
                    ["git", "pull", "origin", current_branch],
                    cwd=mecha_ritya_path,
                    capture_output=True,
                    text=True,
                    timeout=60
                )
                
                if pull_result.returncode == 0:
                    log_success("mecha-ritya successfully updated!")
                else:
                    error_msg = pull_result.stderr.strip() if pull_result.stderr else pull_result.stdout.strip()
                    log_error(f"Error updating mecha-ritya: {error_msg}")
            else:
                log_info("mecha-ritya is up to date.")
        else:
            # Try alternative method: check if HEAD is different from remote branch
            status_result = subprocess.run(
                ["git", "diff", "--quiet", "HEAD", remote_branch],
                cwd=mecha_ritya_path,
                capture_output=True,
                timeout=10
            )
            
            if status_result.returncode == 1:  # There are differences
                log_info("Found updates. Updating mecha-ritya...")
                pull_result = subprocess.run(
                    ["git", "pull", "origin", current_branch],
                    cwd=mecha_ritya_path,
                    capture_output=True,
                    text=True,
                    timeout=60
                )
                
                if pull_result.returncode == 0:
                    log_success("mecha-ritya successfully updated!")
                else:
                    error_msg = pull_result.stderr.strip() if pull_result.stderr else pull_result.stdout.strip()
                    log_error(f"Error updating mecha-ritya: {error_msg}")
            else:
                log_info("mecha-ritya is up to date.")
                
    except subprocess.TimeoutExpired:
        log_warning("Timeout while checking for updates. Check your internet connection.")
    except FileNotFoundError:
        log_warning("Git not found. Install Git for automatic mecha-ritya updates.")
    except Exception as e:
        log_error(f"Error checking for updates: {e}")


def check_and_install_mecha_ritya():
    """
    Checks for the presence of comfy-mecha and mecha-ritya extension.
    If mecha-ritya is missing, clones the repository.
    If mecha-ritya is installed, checks for updates.
    """
    # Get the path to custom_nodes
    custom_nodes_path = os.path.dirname(os.path.dirname(__file__))
    
    # Check for comfy-mecha
    comfy_mecha_path = os.path.join(custom_nodes_path, "comfy-mecha")
    if not os.path.exists(comfy_mecha_path):
        log_warning("comfy-mecha not found. Skipping mecha-ritya check.")
        return
    
    # Check for mecha_extensions directory
    mecha_extensions_path = os.path.join(comfy_mecha_path, "mecha_extensions")
    if not os.path.exists(mecha_extensions_path):
        log_warning("mecha_extensions directory not found in comfy-mecha.")
        return
    
    # Check for mecha-ritya
    mecha_ritya_path = os.path.join(mecha_extensions_path, "mecha-ritya")
    
    if os.path.exists(mecha_ritya_path):
        # Verify that it's a valid extension (contains __init__.py)
        init_file = os.path.join(mecha_ritya_path, "__init__.py")
        if os.path.exists(init_file):
            log_info("mecha-ritya is already installed.")
            # Check for updates
            check_and_update_mecha_ritya(mecha_ritya_path)
            return
    
    # If mecha-ritya is not found, clone the repository
    log_info("mecha-ritya not found. Starting installation...")
    try:
        # Clone the repository into mecha_extensions
        repo_url = "https://github.com/rityak/mecha-ritya.git"
        result = subprocess.run(
            ["git", "clone", repo_url, mecha_ritya_path],
            cwd=mecha_extensions_path,
            capture_output=True,
            text=True,
            timeout=60
        )
        
        if result.returncode == 0:
            log_success("mecha-ritya successfully installed!")
        else:
            error_msg = result.stderr.strip() if result.stderr else result.stdout.strip()
            log_error(f"Error installing mecha-ritya: {error_msg}")
            if "already exists" in error_msg.lower() or "already exists and is not an empty directory" in error_msg.lower():
                log_warning("mecha-ritya directory already exists but is not a valid repository.")
    except subprocess.TimeoutExpired:
        log_warning("Timeout while installing mecha-ritya. Check your internet connection.")
    except FileNotFoundError:
        log_warning("Git not found. Install Git for automatic mecha-ritya installation.")
    except Exception as e:
        log_error(f"Error installing mecha-ritya: {e}")


# Check and install mecha-ritya when the prestartup script is executed
try:
    check_and_install_mecha_ritya()
except Exception as e:
    log_error(f"Error checking mecha-ritya: {e}")

