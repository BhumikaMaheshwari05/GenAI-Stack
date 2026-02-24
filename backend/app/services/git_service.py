# backend/app/services/git_service.py
import os
import subprocess
import shutil
import hashlib

# Directory to store cloned repos
CLONE_DIR = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))), "cloned_repos")
os.makedirs(CLONE_DIR, exist_ok=True)

# File extensions to read as code
CODE_EXTENSIONS = {
    '.py', '.js', '.ts', '.jsx', '.tsx', '.java', '.go', '.rs', '.rb', '.php',
    '.c', '.cpp', '.h', '.hpp', '.cs', '.swift', '.kt', '.scala', '.r',
    '.html', '.css', '.scss', '.sass', '.less',
    '.json', '.yaml', '.yml', '.toml', '.xml', '.ini', '.cfg',
    '.md', '.txt', '.rst',
    '.sh', '.bash', '.zsh', '.bat', '.ps1',
    '.sql', '.graphql',
    '.env.example', '.gitignore', '.dockerignore',
    'Dockerfile', 'Makefile', 'Procfile',
}

# Directories to skip entirely
SKIP_DIRS = {
    'node_modules', '.git', '__pycache__', '.next', 'dist', 'build',
    '.venv', 'venv', 'env', 'myenv', '.tox', '.eggs',
    'vendor', 'target', 'out', 'bin', 'obj',
    '.idea', '.vscode', '.vs',
    'coverage', '.nyc_output', '.cache',
}

# Max total characters to keep context within Gemini's window
MAX_CONTEXT_CHARS = 120_000


def _repo_hash(repo_url: str) -> str:
    """Create a short hash from the repo URL for the folder name."""
    return hashlib.md5(repo_url.strip().lower().encode()).hexdigest()[:12]


def _clone_repo(repo_url: str) -> str:
    """
    Clone a public Git repo (shallow clone). Returns the path to the cloned directory.
    If already cloned, pulls latest changes instead.
    """
    repo_id = _repo_hash(repo_url)
    repo_path = os.path.join(CLONE_DIR, repo_id)

    if os.path.exists(repo_path):
        # Repo already cloned — do a quick pull
        try:
            subprocess.run(
                ["git", "pull", "--ff-only"],
                cwd=repo_path, capture_output=True, timeout=30
            )
        except Exception:
            pass  # If pull fails, use cached version
        return repo_path

    # Fresh shallow clone
    try:
        subprocess.run(
            ["git", "clone", "--depth", "1", repo_url, repo_path],
            capture_output=True, timeout=120, check=True
        )
    except subprocess.CalledProcessError as e:
        raise RuntimeError(f"Failed to clone repo: {e.stderr.decode()}")
    except subprocess.TimeoutExpired:
        shutil.rmtree(repo_path, ignore_errors=True)
        raise RuntimeError("Cloning timed out. The repo might be too large or the URL is invalid.")

    return repo_path


def _should_read_file(file_path: str) -> bool:
    """Check if a file should be read based on its extension."""
    basename = os.path.basename(file_path)
    _, ext = os.path.splitext(file_path)

    # Check by extension
    if ext.lower() in CODE_EXTENSIONS:
        return True

    # Check special filenames (no extension)
    if basename in ('Dockerfile', 'Makefile', 'Procfile', '.gitignore', '.dockerignore'):
        return True

    return False


def _read_repo_files(repo_path: str) -> str:
    """
    Walk the repo directory and concatenate all code files.
    Each file is prefixed with its relative path.
    """
    code_parts = []
    total_chars = 0

    for root, dirs, files in os.walk(repo_path):
        # Skip directories we don't care about
        dirs[:] = [d for d in dirs if d not in SKIP_DIRS]

        for filename in sorted(files):
            file_path = os.path.join(root, filename)
            rel_path = os.path.relpath(file_path, repo_path)

            if not _should_read_file(file_path):
                continue

            try:
                # Skip files larger than 50KB (likely auto-generated)
                if os.path.getsize(file_path) > 50_000:
                    code_parts.append(f"\n--- FILE: {rel_path} ---\n[File too large, skipped]\n")
                    continue

                with open(file_path, 'r', encoding='utf-8', errors='ignore') as f:
                    content = f.read()

                file_block = f"\n--- FILE: {rel_path} ---\n{content}\n"

                if total_chars + len(file_block) > MAX_CONTEXT_CHARS:
                    code_parts.append(f"\n--- FILE: {rel_path} ---\n[Truncated: context limit reached]\n")
                    break
                
                code_parts.append(file_block)
                total_chars += len(file_block)

            except Exception:
                continue  # Skip files that can't be read

        if total_chars >= MAX_CONTEXT_CHARS:
            break

    return "".join(code_parts)


def get_repo_code(repo_url: str) -> str:
    """
    Main entry point: clone/pull a repo and return all its code as a single string.
    """
    if not repo_url or not repo_url.strip():
        return "Error: No repository URL provided."

    # Clean the URL
    repo_url = repo_url.strip()
    if not repo_url.startswith(('http://', 'https://', 'git@')):
        repo_url = f"https://github.com/{repo_url}"
    
    # Add .git suffix if missing
    if not repo_url.endswith('.git'):
        repo_url = repo_url.rstrip('/') + '.git'

    try:
        repo_path = _clone_repo(repo_url)
        code = _read_repo_files(repo_path)
        
        if not code.strip():
            return "Warning: No code files found in the repository."
        
        return code
    except Exception as e:
        return f"Error: {str(e)}"
