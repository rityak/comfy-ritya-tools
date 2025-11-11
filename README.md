# Ritya Tools

A ComfyUI extension providing configuration utilities and tools for model merging workflows. This extension integrates with [comfy-mecha](https://github.com/ljleb/comfy-mecha) to provide a user-friendly interface for generating JSON configurations for model merging operations.

## Features

-   **Multiple Configuration Generators**: Interactive UI for creating JSON configurations for various model merging methods:
    -   **Karcher Mean**: Configuration for `karcher_mean_with_json` function
    -   **Weight Sum**: Configuration for `weight_sum_with_json` function (normalized weighted sum)
    -   **TIES Merging**: Configuration for `ties_merging_with_json` function with block-specific settings
    -   **TIES LoRA**: Configuration for `ties_lora_merging_with_json` function for LoRA merging
    -   **DELLA**: Configuration for `della_linear_with_json` and `della_with_json` functions
-   **Automatic Extension Management**: Automatically installs and updates the [mecha-ritya](https://github.com/rityak/mecha-ritya) extension when comfy-mecha is detected
-   **Conditional UI Display**: The "Ritya Tools" sidebar tab only appears when comfy-mecha is installed
-   **Modern React Interface**: Built with React, TypeScript, and Vite for a responsive and intuitive user experience
-   **Block-Specific Configuration**: Configure different weights and parameters for specific model blocks (input, middle, output, CLIP, etc.)

## Requirements

This extension requires the following dependencies:

-   **[comfy-mecha](https://github.com/ljleb/comfy-mecha)**: A ComfyUI custom node pack for model merging. This is a required dependency.
-   **[mecha-ritya](https://github.com/rityak/mecha-ritya)**: An extension for comfy-mecha that provides additional merging functionality. This extension is automatically installed when comfy-mecha is detected.

## Installation

### Prerequisites

1. Install [comfy-mecha](https://github.com/ljleb/comfy-mecha) first:
    ```bash
    cd ComfyUI/custom_nodes
    git clone https://github.com/ljleb/comfy-mecha.git
    pip install -r comfy-mecha/requirements.txt
    ```

### Install Ritya Tools

#### From ComfyUI Manager (Recommended)

1. Open ComfyUI and go to the Manager
2. Search for "Ritya Tools"
3. Click Install

#### Manual Installation

```bash
# Navigate to your ComfyUI custom_nodes directory
cd ComfyUI/custom_nodes

# Clone the repository
git clone https://github.com/rityak/comfy-ritya-tools.git

# Build the React application
cd comfy-ritya-tools/ui
npm install
npm run build

# Restart ComfyUI
```

⚠️ **Important**: When installing manually, you **must** run `npm run build` in the `ui/` directory before the extension will work. The extension requires the compiled React code in the `dist/` folder to function properly.

## Automatic Extension Installation

When ComfyUI starts, this extension automatically:

1. Checks if `comfy-mecha` is installed
2. If `comfy-mecha` is found, checks for the `mecha-ritya` extension in `comfy-mecha/mecha_extensions`
3. If `mecha-ritya` is not found, automatically clones it from [https://github.com/rityak/mecha-ritya](https://github.com/rityak/mecha-ritya)
4. If `mecha-ritya` is already installed, checks for updates and performs a `git pull` if updates are available

All operations are logged to the console with colored output for easy debugging.

## Usage

After installation and restarting ComfyUI:

1. Ensure that `comfy-mecha` is installed (the "Ritya Tools" tab will only appear if it is)
2. Look for the "Ritya Tools" tab in the ComfyUI sidebar
3. Click to open the configuration utilities

### Configuration Tabs

#### Karcher Mean Configuration

The Karcher Mean tab provides an interactive interface for:

-   Configuring the number of models (2-10)
-   Setting model weights with visual sliders
-   Configuring block-specific weights (input blocks, middle block, output blocks, CLIP L/G, time embed, label embed)
-   Setting advanced parameters (max_iter, tolerance)
-   Generating JSON configuration for use with `karcher_mean_with_json` function
-   Copying the generated JSON to clipboard

#### Weight Sum Configuration

The Weight Sum tab provides an interactive interface for:

-   Configuring the number of models (2-10)
-   Setting normalized model weights (automatically normalized to sum to 1)
-   Configuring block-specific weights for different model blocks
-   Generating JSON configuration for use with `weight_sum_with_json` function
-   Copying the generated JSON to clipboard

#### TIES Merging Configuration

The TIES Merging tab provides an interactive interface for:

-   Configuring the number of models (2-10)
-   Setting model weights and densities (magnitude-based trimming)
-   Configuring block-specific weights, densities, and advanced options
-   Advanced options: vote_sgn, apply_stock (Model Stock scaling), apply_median (Geometric Median)
-   Global parameters: lambda, cos_eps, eps, maxiter, ftol
-   Generating JSON configuration for use with `ties_merging_with_json` function
-   Copying the generated JSON to clipboard

#### TIES LoRA Configuration

The TIES LoRA tab provides an interactive interface for:

-   Configuring the number of LoRA models (2-10)
-   Setting LoRA weights and global density
-   Advanced options: vote_sgn, apply_stock, apply_median
-   Global parameters: lambda, density, cos_eps, eps, maxiter, ftol
-   Generating JSON configuration for use with `ties_lora_merging_with_json` function
-   Copying the generated JSON to clipboard

#### DELLA Configuration

The DELLA tab provides an interactive interface for:

-   Selecting merge type: DELLA Linear or DELLA TIES
-   Configuring the number of models (2-10)
-   Setting model weights, densities, and gammas (MAGPRUNE parameters)
-   Configuring block-specific parameters
-   Global parameters: lambda, vote_sgn (for DELLA TIES)
-   Generating JSON configuration for use with `della_linear_with_json` or `della_with_json` functions
-   Copying the generated JSON to clipboard

## Development

### Setup Development Environment

```bash
# Navigate to the UI directory
cd ui

# Install dependencies
npm install

# Start development mode (watches for changes)
npm run watch
```

### Project Structure

```
comfy-ritya-tools/
├── __init__.py                 # Python entry point for ComfyUI integration
├── prestartup_script.py        # Script that runs before ComfyUI loads nodes
├── logger.py                   # Cross-platform colored logging utility
├── pyproject.toml              # Project metadata for ComfyUI Registry
├── README.md                   # This file
├── dist/                       # Built extension files (generated)
└── ui/                         # React application
    ├── src/
    │   ├── main.tsx            # Entry point for React app
    │   ├── RityaTools.tsx      # Main container component
    │   ├── components/         # Reusable UI components
    │   │   ├── CopyButton.tsx
    │   │   ├── JSONPreview.tsx
    │   │   └── TabButton.tsx
    │   └── tabs/               # Tab components
    │       ├── KarcherMeanConfig.tsx
    │       ├── WeightSumConfig.tsx
    │       ├── TIESConfig.tsx
    │       ├── TIESLoraConfig.tsx
    │       └── DELLAConfig.tsx
    ├── package.json            # npm dependencies
    └── vite.config.ts          # Build configuration
```

## API Endpoints

The extension provides the following API endpoint:

-   `GET /comfy-ritya-tools/check_mecha`: Returns JSON with `{"installed": true/false}` indicating whether comfy-mecha is installed

## Troubleshooting

### Ritya Tools tab not appearing

1. Ensure `comfy-mecha` is installed in `custom_nodes/comfy-mecha`
2. Check the ComfyUI console for any error messages
3. Verify that the frontend was built: `cd ui && npm run build`
4. Restart ComfyUI after installation

### mecha-ritya not installing automatically

1. Ensure Git is installed and available in your PATH
2. Check your internet connection
3. Verify that `comfy-mecha/mecha_extensions` directory exists
4. Check the ComfyUI console for error messages

## Contributing

Contributions are welcome! Feel free to open issues or submit pull requests to improve this extension.

## License

GNU General Public License v3

## Links

-   [comfy-mecha](https://github.com/ljleb/comfy-mecha) - Required dependency
-   [mecha-ritya](https://github.com/rityak/mecha-ritya) - Automatically installed extension
-   [ComfyUI Documentation](https://docs.comfy.org/) - Official ComfyUI documentation
