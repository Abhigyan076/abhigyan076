<?php

namespace Pterodactyl\Console\Commands;

use Illuminate\Console\Command;
use Symfony\Component\Console\Formatter\OutputFormatterStyle;
use Illuminate\Support\Facades\File;
use Pterodactyl\Models\Setting;

class Arix extends Command
{
    protected $signature = "arix {action?}";
    protected $description = "All commands for Arix Theme for Pterodactyl.";

    /**
     * Brand tag prefixed to every status line during install/update.
     * Kept as a single constant so the branding stays consistent
     * everywhere it's used.
     */
    private const TAG = "<fg=#8B5CF6;options=bold>[</><fg=white;options=bold> SYNORA </><fg=#8B5CF6;options=bold>]</>";

    public function handle()
    {
        $action = $this->argument("action");

        $title = new OutputFormatterStyle("#fff", null, ["bold"]);
        $this->output->getFormatter()->setStyle("title", $title);
        $b = new OutputFormatterStyle(null, null, ["bold"]);
        $this->output->getFormatter()->setStyle("b", $b);

        // Custom formatter styles for the branded output (2-color scheme:
        // theme primary purple #4A35CF/#8B5CF6 + white/gray, matching the
        // Arix theme's own default accent color).
        $this->output->getFormatter()->setStyle('brand', new OutputFormatterStyle('#8B5CF6', null, ['bold']));
        $this->output->getFormatter()->setStyle('brandDim', new OutputFormatterStyle('#8B5CF6', null, []));
        $this->output->getFormatter()->setStyle('sub', new OutputFormatterStyle('white', null, []));
        $this->output->getFormatter()->setStyle('subBold', new OutputFormatterStyle('white', null, ['bold']));
        $this->output->getFormatter()->setStyle('muted', new OutputFormatterStyle('gray', null, []));

        if ($action === null) {
            $this->printBanner();
            $this->line("");
            $this->line("  <sub>Usage</sub>");
            $this->line("    <brandDim>›</brandDim> php artisan arix          <muted>(this window)</muted>");
            $this->line("    <brandDim>›</brandDim> php artisan arix install");
            $this->line("    <brandDim>›</brandDim> php artisan arix update");
            $this->line("    <brandDim>›</brandDim> php artisan arix uninstall");
            $this->line("");
            $this->printFooter();
        } else {
            $this->printBanner(true);
            if ($action === "install") {
                $this->install();
            } elseif ($action === "update") {
                $this->update();
            } elseif ($action === "uninstall") {
                $this->uninstall();
            } else {
                $this->line("");
                $this->line("  " . self::TAG . " <fg=red;options=bold>Invalid action.</> Supported actions: install, update, uninstall");
                $this->line("");
            }
        }
    }

    /**
     * Branded ASCII banner. Purely cosmetic — printed before the real
     * install/update/uninstall logic runs, changes nothing about the
     * underlying process.
     */
    private function printBanner($compact = false)
    {
        $this->line("");
        $this->line("<brand>   ░█████╗░██████╗░██╗██╗░░██╗</brand>");
        $this->line("<brand>   ██╔══██╗██╔══██╗██║╚██╗██╔╝</brand>");
        $this->line("<brand>   ███████║██████╔╝██║░╚███╔╝░</brand>");
        $this->line("<brand>   ██╔══██║██╔══██╗██║░██╔██╗░</brand>");
        $this->line("<brand>   ██║░░██║██║░░██║██║██╔╝╚██╗</brand>");
        $this->line("<brand>   ╚═╝░░╚═╝╚═╝░░╚═╝╚═╝╚═╝░░╚═╝</brand>");
        $this->line("");
        $this->line("   <subBold>Arix Theme</subBold> <muted>for Pterodactyl</muted>");
        if (!$compact) {
            $this->line("   <muted>Thank you for purchasing Arix.</muted>");
        }
        $this->line("");
        $this->line("   <brandDim>─────────────────────────────────────</brandDim>");
    }

    /**
     * Developer / organisation / support branding shown at the bottom
     * of the command's default (no-argument) output.
     */
    private function printFooter()
    {
        $this->line("  <brandDim>─────────────────────────────────────</brandDim>");
        $this->line("   <muted>Developer</muted>      <sub>its2yashpatel_</sub>");
        $this->line("   <muted>Organisation</muted>   <sub>Synora 乂 𝙳evelopment</sub>");
        $this->line("   <muted>Support</muted>        <sub>https://dsc.gg/synoraxdev</sub>");
        $this->line("");
    }

    /**
     * Wraps a status message with the [ SYNORA ] tag for a consistent,
     * branded look across every step of install/update/uninstall.
     */
    private function step(string $message)
    {
        $this->line("  " . self::TAG . " <sub>{$message}</sub>");
    }

    private function stepDone(string $message)
    {
        $this->line("  " . self::TAG . " <fg=green;options=bold>✓</> <sub>{$message}</sub>");
    }

    public function installOrUpdate($isUpdate = false)
    {
        if ($isUpdate) {
            $this->line("");
            $this->line("  " . self::TAG . " <fg=yellow;options=bold>Note:</> this command skips files commonly modified by");
            $this->line("            addons during an update, to avoid overwriting your");
            $this->line("            addon customizations. Contact support if issues persist.");
        }

        $this->line("");
        $confirmation = $this->confirm("Are all the required dependencies installed from the readme file?", "yes");
        if (!$confirmation) {
            return;
        }

        $versions = File::directories("./arix");
        if (empty($versions)) {
            $this->line("");
            $this->line("  " . self::TAG . " <fg=red;options=bold>No versions found</> in the /arix directory.");
            $this->line("");
            return;
        }

        $version = basename($this->choice("Select a version:", $versions));

        $this->line("");
        $this->line("  <brandDim>─────────────────────────────────────</brandDim>");
        $this->step("Installing Arix Theme <fg=white;options=bold>{$version}</>...");
        $this->line("  <brandDim>─────────────────────────────────────</brandDim>");
        $this->line("");

        $excludeOption = $isUpdate ? "--exclude='routes.ts' --exclude='getServer.ts' --exclude='admin.blade.php' --exclude='admin.php' --exclude='ServerTransformer.php'" : '';
        exec("rsync -a {$excludeOption} arix/{$version}/ ./");

        $directoryPath = app_path("Http/Controllers/Admin/Arix");
        File::makeDirectory($directoryPath, 0755, true, true);

        $filesOne = ["ArixController", "ArixAdvancedController", "ArixAnnouncementController", "ArixColorsController", "ArixComponentsController", "ArixDashboardController", "ArixLayoutController"];
        $this->step("Proceeding with the installation...");
        foreach ($filesOne as $file) {
            $this->aa($file, $version, $directoryPath);
            sleep(1);
        }

        $filesTwo = ["ArixLinkController", "ArixMailController", "ArixMetaController", "ArixPresetController", "ArixSocialController", "ArixStylingController"];
        foreach ($filesTwo as $file) {
            $this->aa($file, $version, $directoryPath);
            sleep(1);
        }

        $this->line("");
        $this->step("Migrating database...");
        $this->command("php artisan migrate --force");
        $this->stepDone("Database migrated.");

        $this->line("");
        $this->step("Installing required packages... <muted>(this can take a minute)</muted>");
        $this->command("yarn add react-email-editor react-colorful recharts@^2.15.4 ua-parser-js cronstrue react-day-picker jszip react-turnstile @dnd-kit/core @dnd-kit/sortable @dnd-kit/utilities @types/md5 md5 react-icons@5.4.0 markdown-to-jsx@7.7.10 i18next-browser-languagedetector@7.2.1");
        $this->stepDone("Packages installed.");

        $this->line("");
        $this->step("Compiling translations...");
        $this->command("php artisan language:compile");
        $this->stepDone("Translations compiled.");

        $this->line("");
        $this->step("Building panel assets... <muted>(this can take a minute)</muted>");
        $nodeVersion = shell_exec("node -v");
        $nodeVersion = (int) ltrim($nodeVersion, "v");
        if ($nodeVersion >= 17) {
            $this->line("  " . self::TAG . " <muted>Node.js v{$nodeVersion} detected (>= 17), applying legacy OpenSSL provider.</muted>");
            putenv("NODE_OPTIONS=--openssl-legacy-provider");
        } else {
            $this->line("  " . self::TAG . " <muted>Node.js v{$nodeVersion} detected.</muted>");
        }
        $this->command("yarn build:production");
        $this->stepDone("Panel assets built.");

        $this->line("");
        $this->step("Setting permissions...");
        $this->command("chown -R www-data:www-data /var/www/pterodactyl/* " . base_path() . "/*");
        $this->command("chown -R nginx:nginx " . base_path() . "/*");
        $this->command("chown -R apache:apache " . base_path() . "/*");
        $this->stepDone("Permissions set.");

        $this->line("");
        $this->step("Optimizing application...");
        $this->command("php artisan optimize:clear");
        $this->command("php artisan optimize");
        $this->stepDone("Application optimized.");

        $this->line("");
        $this->step("Restarting workers...");
        $this->command("php artisan queue:restart");
        $this->stepDone("Workers restarted.");

        $headline = $isUpdate ? "Theme updated successfully" : "Theme installed successfully";
        $this->printSuccessBox($headline);
        $this->line("");
        $this->printFooter();
    }

    /**
     * Renders a bordered success box sized to fit the given message,
     * so the border never misaligns regardless of message length.
     */
    private function printSuccessBox(string $message)
    {
        $innerWidth = strlen($message) + 6; // "✓ " + message + padding
        $border = str_repeat("─", $innerWidth);

        $this->line("");
        $this->line("  <brandDim>╭{$border}╮</brandDim>");
        $this->line("  <brandDim>│</brandDim>  <fg=green;options=bold>✓</> <subBold>{$message}</subBold>  <brandDim>│</brandDim>");
        $this->line("  <brandDim>╰{$border}╯</brandDim>");
    }

    private function aa($filename, $version, $directoryPath)
    {
        $filePath = $directoryPath . "/" . $filename . ".php";
        $localSource = base_path("arix/" . $version . "/app/Http/Controllers/Admin/Arix/" . $filename . ".php");

        if (File::exists($localSource)) {
            $this->line("  " . self::TAG . " <muted>→</muted> <sub>Copying {$filename}.php...</sub>");
            File::copy($localSource, $filePath);
        } else {
            $this->line("  " . self::TAG . " <fg=red;options=bold>✗</> <sub>Could not find {$filename}.php at {$localSource}.</sub>");
        }
    }

    public function install()
    {
        $this->installOrUpdate();
        $this->stepDone("Arix Theme installation completed!");
        $this->line("");
    }

    public function update()
    {
        $this->installOrUpdate(true);
    }

    private function uninstall()
    {
        $this->line("");
        $this->line("  <brandDim>─────────────────────────────────────</brandDim>");
        $this->step("Uninstalling Arix Theme...");
        $this->line("  <brandDim>─────────────────────────────────────</brandDim>");
        $this->line("");

        $this->command("php artisan down");
        $this->command("curl -L https://github.com/pterodactyl/panel/releases/latest/download/panel.tar.gz | tar -xzv");
        $this->command("chmod -R 755 storage/* bootstrap/cache");
        $this->command("composer install --no-dev --optimize-autoloader");
        $this->command("php artisan view:clear");
        $this->command("php artisan config:clear");
        $this->command("php artisan migrate --seed --force");

        $this->pruneArixSettings();

        $this->command("chown -R www-data:www-data " . base_path() . "/*");
        $this->command("chown -R nginx:nginx " . base_path() . "/*");
        $this->command("chown -R apache:apache " . base_path() . "/*");
        $this->command("php artisan queue:restart");
        $this->command("php artisan up");

        $this->printSuccessBox("Theme fully uninstalled");
        $this->line("   <muted>All saved Arix settings have been cleared.</muted>");
        $this->line("");
        $this->printFooter();
    }

    /**
     * Removes every Arix configuration value stored in the settings table
     * (key pattern settings::arix:%) so a future install starts clean
     * instead of picking the old configuration back up.
     */
    private function pruneArixSettings()
    {
        $this->step("Removing saved Arix configuration...");
        $count = Setting::query()->where('key', 'like', 'settings::arix:%')->delete();
        $this->stepDone("Removed {$count} Arix setting entries.");
    }

    private function command($cmd)
    {
        return exec($cmd);
    }
}
