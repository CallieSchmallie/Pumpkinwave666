# SPDX-License-Identifier: GPL-3.0-only WITH GPL-3.0-linking-exception
# CI helper (windows-latest): obtain JieLi Windows toolchain 2.5.3 and export
# FM1_PI32_TOOLCHAIN. sdk/Build.ps1 then verifies all 22 toolchain files
# against sdk/manifest.json, so a wrong or partial toolchain fails loudly.
#
# Sources, in order:
#   1. $env:JIELI_TOOLCHAIN_URL - a .zip or .7z of an installed C:\JL\pi32 tree
#      (set it as a repository variable if the official installer cannot be
#      unpacked unattended)
#   2. the official installer from JieLi, unpacked with 7-Zip
#   3. the official installer run silently (NSIS, then Inno Setup switches)
[CmdletBinding()]
param([string]$Url = 'https://jl-update.oss-cn-shenzhen.aliyuncs.com/2.5.3.exe')
$ErrorActionPreference = 'Stop'
$root = [IO.Path]::GetFullPath((Join-Path $PSScriptRoot '../..'))
$manifest = Get-Content -LiteralPath (Join-Path $root 'sdk/manifest.json') -Raw | ConvertFrom-Json
$expected = $manifest.external_toolchain.files.'bin/clang.exe'
$work = Join-Path ([IO.Path]::GetTempPath()) 'jieli'
New-Item -ItemType Directory -Force -Path $work | Out-Null

function Find-Pi32([string[]]$roots) {
    foreach ($r in $roots) {
        if (!(Test-Path -LiteralPath $r)) { continue }
        foreach ($clang in Get-ChildItem -LiteralPath $r -Recurse -Filter clang.exe -File -ErrorAction SilentlyContinue) {
            if ($clang.Directory.Name -ne 'bin') { continue }
            $hash = (Get-FileHash -LiteralPath $clang.FullName -Algorithm SHA256).Hash.ToLowerInvariant()
            if ($hash -eq $expected) { return $clang.Directory.Parent.FullName }
            Write-Host "Ignoring clang.exe with another hash: $($clang.FullName)"
        }
    }
    return $null
}
function Use-Pi32([string]$dir) {
    Write-Host "JieLi toolchain: $dir"
    "FM1_PI32_TOOLCHAIN=$dir" | Out-File -FilePath $env:GITHUB_ENV -Append -Encoding utf8
    exit 0
}
$sevenZip = @('C:\Program Files\7-Zip\7z.exe', (Get-Command 7z -ErrorAction SilentlyContinue).Source) | Where-Object { $_ -and (Test-Path $_) } | Select-Object -First 1

if ($env:JIELI_TOOLCHAIN_URL) {
    $archive = Join-Path $work ('toolchain' + [IO.Path]::GetExtension(([Uri]$env:JIELI_TOOLCHAIN_URL).AbsolutePath))
    Write-Host 'Downloading toolchain archive from JIELI_TOOLCHAIN_URL'
    curl.exe --fail --location --retry 3 --output $archive $env:JIELI_TOOLCHAIN_URL
    if ($LASTEXITCODE) { throw 'Toolchain archive download failed.' }
    $out = Join-Path $work 'archive'
    if ($archive.EndsWith('.zip')) { Expand-Archive -LiteralPath $archive -DestinationPath $out -Force }
    else { & $sevenZip x -y "-o$out" $archive | Out-Null }
    $found = Find-Pi32 @($out); if ($found) { Use-Pi32 $found }
    throw 'JIELI_TOOLCHAIN_URL did not contain pi32/bin/clang.exe with the expected SHA-256.'
}

$installer = Join-Path $work '2.5.3.exe'
Write-Host "Downloading JieLi installer: $Url"
curl.exe --fail --location --retry 3 --output $installer $Url
if ($LASTEXITCODE) { throw 'JieLi installer download failed (the host may block this runner; set JIELI_TOOLCHAIN_URL).' }

if ($sevenZip) {
    $out = Join-Path $work 'unpacked'
    & $sevenZip x -y "-o$out" $installer | Out-Null
    $found = Find-Pi32 @($out)
    if (!$found) {
        # Installers often nest the payload in a second archive.
        foreach ($inner in Get-ChildItem -LiteralPath $out -Recurse -File -Include *.7z,*.zip,*.cab,*.exe -ErrorAction SilentlyContinue) {
            $dest = Join-Path $out ('inner_' + $inner.BaseName)
            & $sevenZip x -y "-o$dest" $inner.FullName | Out-Null
        }
        $found = Find-Pi32 @($out)
    }
    if ($found) { Use-Pi32 $found }
}

$target = 'C:\JL'
foreach ($switches in @(@('/S', "/D=$target"), @('/VERYSILENT', '/SUPPRESSMSGBOXES', '/NORESTART', '/SP-', "/DIR=$target"))) {
    Write-Host "Running installer silently: $($switches -join ' ')"
    $p = Start-Process -FilePath $installer -ArgumentList $switches -PassThru
    if (!$p.WaitForExit(900000)) { $p.Kill(); Write-Host 'Installer timed out.'; continue }
    $found = Find-Pi32 @($target, 'C:\JL', "$env:ProgramFiles", "${env:ProgramFiles(x86)}", "$env:LOCALAPPDATA")
    if ($found) { Use-Pi32 $found }
}
throw 'Could not obtain JieLi toolchain 2.5.3 unattended. Install it on a Windows PC, zip C:\JL\pi32, host the zip and set the JIELI_TOOLCHAIN_URL repository variable.'
