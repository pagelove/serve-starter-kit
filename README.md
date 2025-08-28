# Pagelove Serve Starter Kit

A minimal starter template for Pagelove projects with best practices and examples.

## Features

- ✨ Pre-configured `pagelove.json`
- 📊 Example HTML with microdata markup
- 🎯 CSS Selector Range unit examples
- 🎨 Basic responsive styles
- 📱 Mobile-friendly viewport setup

## Quick Start

Use this template with the Pagelove CLI:

```bash
pagelove init -t https://github.com/pagelove/serve-starter-kit
```

Or clone directly:

```bash
git clone https://github.com/pagelove/serve-starter-kit my-project
cd my-project
pagelove serve
```

## Project Structure

```
.
├── docs/               # Main content directory
│   ├── index.html     # Homepage with microdata examples
│   ├── about.html     # About page
│   └── styles.css     # Base styles
├── pagelove.json      # Pagelove configuration
└── README.md          # This file
```

## Examples Included

### CSS Selector Range Units
Test the selector range functionality:

```bash
# Get specific elements
curl -H "Range: selector=#hero" http://localhost:5683/

# Get microdata as JSON-LD
curl -H "Accept: application/ld+json" http://localhost:5683/
```

## Customization

1. Update `pagelove.json` with your project details
2. Modify the HTML templates in `docs/`
3. Add your own styles and scripts
4. Deploy with `pagelove deploy` (when available)

## License

MIT