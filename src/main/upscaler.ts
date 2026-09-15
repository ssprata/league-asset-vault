import fs from 'fs';
import path from 'path';
import { execFile } from 'child_process';
import { app } from 'electron';
import { ResolutionScale, DenoiseLevel } from '../shared/types';

export interface Waifu2xOptions {
  scale?: 2 | 4;
  denoise?: DenoiseLevel;
  modelName?: string;
  tileSize?: number;
  gpuId?: number;
}

export interface Waifu2xPaths {
  binaryPath: string;
  modelDirPath: string;
}

/**
 * Builds the fingerprinted filename for cached upscaled assets:
 * Format: <assetId>_scale<scale>x_noise<noiseLevel>.png (e.g. 3031_scale4x_noise3.png)
 */
export function getFingerprintedFilename(
  assetId: string,
  scale: ResolutionScale,
  noiseLevel: DenoiseLevel = 3
): string {
  const scaleNum = scale === '4x' ? '4' : '2';
  return `${assetId}_scale${scaleNum}x_noise${noiseLevel}.png`;
}

/**
 * Resolves the absolute path to waifu2x-ncnn-vulkan executable and models directory.
 * Accurately detects whether running inside packaged production app or local development.
 */
export function getWaifu2xPaths(modelName: string = 'models-cunet'): Waifu2xPaths {
  const isPackaged = app?.isPackaged ?? false;
  const binaryName = process.platform === 'win32' ? 'waifu2x-ncnn-vulkan.exe' : 'waifu2x-ncnn-vulkan';

  const appDir = app?.getAppPath ? app.getAppPath() : process.cwd();
  const prodBase = path.join(
    process.resourcesPath || path.join(appDir, '..'),
    'bin',
    'waifu2x'
  );
  const devBase = path.join(process.cwd(), 'resources', 'bin', 'waifu2x');

  let selectedBase = devBase;
  if (isPackaged && fs.existsSync(path.join(prodBase, binaryName))) {
    selectedBase = prodBase;
  } else if (fs.existsSync(path.join(devBase, binaryName))) {
    selectedBase = devBase;
  }

  const binaryPath = path.join(selectedBase, binaryName);
  const modelDirPath = path.join(selectedBase, modelName);

  return { binaryPath, modelDirPath };
}

/**
 * Executes waifu2x-ncnn-vulkan via child_process.execFile.
 * Runs non-blocking and asynchronously on worker threads.
 * 
 * CLI Arguments:
 * -i <input_path>
 * -o <output_path>
 * -s <scale_factor> (2 or 4)
 * -n <noise_level> (0, 1, 2, or 3)
 * -m <model_dir> (locked to models-cunet for Artwork style)
 * -f png
 * 
 * @param inputPath  Absolute path to source image (e.g. 1x original PNG)
 * @param outputPath Absolute path where upscaled image should be written
 * @param options    Upscaling configuration (scale, denoise, model, gpuId)
 */
export function runWaifu2x(
  inputPath: string,
  outputPath: string,
  options: Waifu2xOptions = {}
): Promise<string> {
  return new Promise((resolve, reject) => {
    const scale = options.scale ?? 4;
    const denoise = options.denoise ?? 3; // Default recommendation for League icons
    const modelName = options.modelName ?? 'models-cunet'; // Permanently locked to Artwork CU-Net

    // Verify source file exists
    if (!fs.existsSync(inputPath)) {
      return reject(new Error(`[Waifu2x] Input file does not exist: ${inputPath}`));
    }

    // Ensure output directory exists
    const outDir = path.dirname(outputPath);
    if (!fs.existsSync(outDir)) {
      fs.mkdirSync(outDir, { recursive: true });
    }

    const { binaryPath, modelDirPath } = getWaifu2xPaths(modelName);

    if (!fs.existsSync(binaryPath)) {
      return reject(
        new Error(`[Waifu2x] Executable not found at '${binaryPath}'. Check electron extraResources.`)
      );
    }

    if (!fs.existsSync(modelDirPath)) {
      return reject(
        new Error(`[Waifu2x] Model directory not found at '${modelDirPath}'.`)
      );
    }

    // Exact CLI argument array construction
    const args: string[] = [
      '-i', inputPath,
      '-o', outputPath,
      '-s', scale.toString(),
      '-n', denoise.toString(),
      '-m', modelDirPath,
      '-f', 'png',
    ];

    if (options.gpuId !== undefined) {
      args.push('-g', options.gpuId.toString());
    }

    if (options.tileSize) {
      args.push('-t', options.tileSize.toString());
    }

    console.log(`[Waifu2x] Executing: ${path.basename(binaryPath)} ${args.join(' ')}`);

    // Execute asynchronously via execFile (avoids shell spawning overhead and vulnerability)
    execFile(
      binaryPath,
      args,
      {
        windowsHide: true,
        maxBuffer: 10 * 1024 * 1024,
      },
      (error, stdout, stderr) => {
        if (error) {
          console.error('[Waifu2x] Error during execution:', error);
          if (stderr) console.error('[Waifu2x] stderr:', stderr);
          return reject(
            new Error(`Waifu2x failed with code ${error.code || 'UNKNOWN'}: ${stderr || error.message}`)
          );
        }

        // Verify output file was created and is non-empty
        if (!fs.existsSync(outputPath) || fs.statSync(outputPath).size === 0) {
          return reject(
            new Error(`[Waifu2x] Output file was not created or is 0 bytes: ${outputPath}`)
          );
        }

        resolve(outputPath);
      }
    );
  });
}
