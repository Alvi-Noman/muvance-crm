# tree.ps1
# Prints an ASCII directory tree.
# - Directories first (alphabetical), then files (alphabetical)
# - Includes hidden files (uses -Force)
# - Skips common unnecessary directories/files (node_modules, .git, dist, Python venv, etc.)
# Usage: .\tree.ps1            -> uses the script's directory as root
#        .\tree.ps1 -Path .    -> specify a root to print

param(
  [string]$Path = $PSScriptRoot
)

# Folders to skip entirely
$ExcludedDirNames = @(
  '.git',
  '.hg',
  '.svn',
  'node_modules',
  '.turbo',
  '.next',
  '.cache',
  '.yarn',
  '.pnpm-store',
  'dist',
  'build',
  'out',
  'coverage',
  '.vercel',
  '.parcel-cache',
  '.docusaurus',
  '.svelte-kit',
  '.angular',
  '.expo',
  'temp',
  'tmp',
  '.venv',
  'venv',
  'env',
  '__pycache__',
  '.pytest_cache',
  '.mypy_cache',
  '.tox',
  '.eggs',
  '.ipynb_checkpoints',
  'htmlcov',
  'Lib',
  'Scripts',
  'Include',
  'lib64',
  'share'
)

# Files to skip
$ExcludedFileNames = @(
  '.DS_Store',
  'Thumbs.db',
  'desktop.ini',
  'pip-log.txt',
  'pip-delete-this-directory.txt',
  'coverage.xml',
  'pyvenv.cfg'
)

# File patterns to skip
$ExcludedFilePatterns = @(
  '*.pyc',
  '*.pyo',
  '*.pyd',
  '*.cover',
  '*.log',
  '*.egg-info'
)

function ShouldSkip([System.IO.FileSystemInfo]$item) {
  if ($item.PSIsContainer) {
    if ($ExcludedDirNames -contains $item.Name) {
      return $true
    }
    foreach ($pattern in $ExcludedFilePatterns) {
      if ($item.Name -like $pattern) {
        return $true
      }
    }
    return $false
  } else {
    if ($ExcludedFileNames -contains $item.Name) {
      return $true
    }
    foreach ($pattern in $ExcludedFilePatterns) {
      if ($item.Name -like $pattern) {
        return $true
      }
    }
    return $false
  }
}

function Get-Children([string]$path) {
  $items = @(Get-ChildItem -LiteralPath $path -Force -ErrorAction SilentlyContinue)
  if (-not $items) { return @() }
  
  $filtered = $items | Where-Object { -not (ShouldSkip $_) }
  
  $dirs  = @($filtered | Where-Object { $_.PSIsContainer }     | Sort-Object Name)
  $files = @($filtered | Where-Object { -not $_.PSIsContainer } | Sort-Object Name)
  
  $combined = @()
  if ($dirs)  { $combined += $dirs }
  if ($files) { $combined += $files }
  
  return $combined
}

function Write-Tree([string]$path, [object[]]$ancestorsHasNext = @()) {
  $children = Get-Children $path
  if (-not $children) { return }
  
  $lastIndex = $children.Count - 1
  
  for ($i = 0; $i -le $lastIndex; $i++) {
    $child  = $children[$i]
    $isLast = ($i -eq $lastIndex)
    
    $prefix = ""
    foreach ($hasNext in $ancestorsHasNext) {
      if ($hasNext) { $prefix += "| " } else { $prefix += "  " }
    }
    
    $connector = if ($isLast) { "+-- " } else { "|-- " }
    Write-Host ($prefix + $connector + $child.Name)
    
    if ($child.PSIsContainer) {
      $newAncestors = @()
      if ($ancestorsHasNext) { $newAncestors += $ancestorsHasNext }
      $newAncestors += (-not $isLast)
      
      Write-Tree -path $child.FullName -ancestorsHasNext $newAncestors
    }
  }
}

Write-Tree -path (Resolve-Path -LiteralPath $Path).Path