$PSScriptRoot
Write-Host $PSScriptRoot

$pihome = $env:PIHOME64
$symbolFolder = $pihome + "PIVision\Scripts\app\editor\symbols\ext"

if (-Not (Test-Path $symbolFolder)) {
    Write-Host "Not on the PI Vision server"
    Read-Host 
    exit
}

$files = @("sym-thresholdtrend-config.html", "sym-thresholdtrend.css", "sym-thresholdtrend-template.html", "sym-thresholdtrend.js")

foreach ($file in $files) {
    $source = $PSScriptRoot + "\" + $file
    $target = $symbolFolder
    copy $source $target
}