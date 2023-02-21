<?php

namespace GeneroWP\VideoOptimizer;

use WP_Post;

class Plugin
{
    public $name = 'wp-video-optimizer';
    public $file;
    public $path;
    public $url;

    protected static $instance;

    public static function getInstance()
    {
        if (!isset(self::$instance)) {
            self::$instance = new static();
        }
        return self::$instance;
    }

    public function __construct()
    {
        $this->file = realpath(__DIR__ . '/../wp-video-optimizer.php');
        $this->path = untrailingslashit(plugin_dir_path($this->file));
        $this->url = untrailingslashit(plugin_dir_url($this->file));

        add_action('init', [$this, 'loadTextdomain']);
        add_action('wp_enqueue_media', [$this, 'enqueueAssets']);
        add_filter('attachment_fields_to_edit', [$this, 'addMediaFields'], 10, 2);
    }

    public function addMediaFields(array $fields, WP_Post $post): array
    {
        if (substr($post->post_mime_type, 0, 5) !== 'video') {
            return $fields;
        }
        ob_start();
        ?>
        <div
            class="video-optimizer-wrapper"
        >
            <video-optimizer-app
                resource-url="<?php echo wp_get_attachment_url($post->ID); ?>"
                rest-nonce="<?php echo wp_create_nonce('wp_rest'); ?>"
                admin-path="<?php echo admin_url('upload.php'); ?>"
                ffmpeg-core-path="<?php echo "{$this->url}/dist/ffmpeg-core/ffmpeg-core.js"; ?>"
                :attachment-data='<?php echo json_encode(array_filter([
                    'title' => $post->post_title,
                    'caption' => $post->post_excerpt,
                    'description' => $post->post_content,
                    'lang' => function_exists('pll_get_post_language') ? pll_get_post_language($post->ID) : null,
                ])); ?>'
            >
                <button class="button button-small" data-video-optimizer-init>Start optimizing</button>
            </video-optimizer-app>
        </div>
        <?php
        $html = ob_get_clean();

        $fields['video_optimizer'] = [
            'input' => 'html',
            'label' => __('Optimize Video', 'wp-video-optimizer'),
            'html' => $html,
        ];

        return $fields;
    }

    public function enqueueAssets(): void
    {
        wp_enqueue_script(
            "{$this->name}/js",
            "{$this->url}/dist/main.js",
            ['media'],
            filemtime($this->path . '/dist/main.js')
        );

        wp_add_inline_script(
            "{$this->name}/js",
            sprintf('window.videoOptimizerWebpackPublicPath = "%s";', $this->url . '/dist/'),
            'before'
        );
    }

    public function loadTextdomain(): void
    {
        load_plugin_textdomain(
            $this->name,
            false,
            dirname(plugin_basename($this->file)) . '/languages'
        );
    }

}
