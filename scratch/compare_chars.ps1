function toSlug($name) {
    $normalized = $name.ToLower().Normalize([System.Text.NormalizationForm]::FormD)
    $sb = New-Object System.Text.StringBuilder
    foreach ($c in $normalized.ToCharArray()) {
        if ([System.Globalization.CharUnicodeInfo]::GetUnicodeCategory($c) -ne [System.Globalization.UnicodeCategory]::NonSpacingMark) {
            [void]$sb.Append($c)
        }
    }
    $clean = $sb.ToString()
    $clean = $clean -replace '[^a-z0-9]+', '-'
    $clean = $clean.Trim('-')
    return $clean
}

# Read characters.js
$content = Get-Content -Path "c:\Users\Jose Antonio\Desktop\LQSA\characters.js" -Raw -Encoding utf8

# Find names: nombre: "..."
$matches = [regex]::Matches($content, 'nombre:\s*"([^"]+)"')
$charNames = @()
$charSlugs = @{}
foreach ($m in $matches) {
    $name = $m.Groups[1].Value
    $charNames += $name
    $slug = toSlug($name)
    $charSlugs[$slug] = $name
}

# Read img/personajes directory
$imgDir = "c:\Users\Jose Antonio\Desktop\LQSA\img\personajes"
$files = Get-ChildItem -Path $imgDir -Filter *.webp
$imgSlugs = @{}
foreach ($f in $files) {
    $slug = $f.BaseName
    $imgSlugs[$slug] = $f.Name
}

Write-Host "=== CHARACTERS IN characters.js BUT NO WEBP IMAGE ==="
foreach ($slug in $charSlugs.Keys) {
    if (-not $imgSlugs.ContainsKey($slug)) {
        Write-Host "- $($charSlugs[$slug]) (expected: $slug.webp)"
    }
}

Write-Host "`n=== WEBP IMAGES IN img/personajes BUT NO CHARACTER IN characters.js ==="
foreach ($slug in $imgSlugs.Keys) {
    if (-not $charSlugs.ContainsKey($slug)) {
        Write-Host "- $($imgSlugs[$slug])"
    }
}
