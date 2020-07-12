<# 
.SYNOPSIS
Moves the custom symbol to the PI Vision extensibility folder, only works on the PI Vision machine

.DESCRIPTION
Automates the deployment of this custom sybmol for use in testing

.EXAMPLE
PS C:\Sample> .\deploy.ps1

#>

$pihome = $env:PIHOME64
$symbolFolder = $pihome + "PIVision\Scripts\app\editor\symbols\ext"

if (-Not (Test-Path $symbolFolder)) {
    Write-Host "Not on the PI Vision server or ext folder is missing"
    Read-Host 
    exit
}

$files = @("sym-thresholdtrend-config.html", "sym-thresholdtrend.css", "sym-thresholdtrend-template.html", "sym-thresholdtrend.js")

foreach ($file in $files) {
    $source = $PSScriptRoot + "\" + $file
    $target = $symbolFolder
    Copy-Item $source $target
}