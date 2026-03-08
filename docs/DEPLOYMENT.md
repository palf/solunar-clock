# Deployment Guide

This document outlines the deployment strategies for the Solunar Globe Clock across different platforms.

## 1. Web Deployment (Current)

The project is built as a static web application using Vite.

### Target A: Railway (Recommended for Ease)
[Railway](https://railway.com/) is the simplest way to deploy.

1.  **Connect GitHub:** Point Railway to your repository.
2.  **Build Command:** `pnpm install && pnpm run build`
3.  **Publish Directory:** `dist`
4.  **Pricing:** Uses Railway's [Trial or Hobby plans](https://railway.com/pricing).

### Target B: AWS (Recommended for Reliability)
For high-availability deployment using S3 and CloudFront.

1.  **Build Locally:** `pnpm run build`
2.  **S3 Bucket:** Upload the contents of `dist/` to an S3 bucket configured for Static Website Hosting.
3.  **CloudFront:** Create a distribution pointing to the S3 bucket to provide HTTPS and global edge caching.
4.  **Permissions:** Ensure the S3 bucket policy allows `public-read` or restricted access via CloudFront OAI.

---

## 2. Raspberry Pi Zero Deployment (Future Target)

As documented in **ADR 003**, the long-term goal is to pivot to a standalone **Rust binary** to eliminate browser overhead.

### Current (Chromium Kiosk)
Until the Rust pivot is complete, use the browser-based kiosk mode:

1.  **OS:** Raspberry Pi OS Lite (64-bit or 32-bit for Zero v1).
2.  **Hardware Acceleration:** Enable the Full KMS driver in `raspi-config`.
3.  **Kiosk Script:**
    ```bash
    # Install minimal X server and Chromium
    sudo apt install xserver-xorg xinit chromium-browser
    
    # Run the kiosk.sh script provided in README.md
    ./kiosk.sh
    ```

### Target: Standalone Rust Binary (Post-Pivot)
The final production state will run as a native binary using OpenGL ES 2.0.

1.  **Renderer:** Uses the `3D` GLSL shaders developed in this reference implementation.
2.  **Environment:** Runs directly via the **KMS/DRM Framebuffer**. 
    *   No X11 or Wayland required.
    *   Talking directly to `/dev/dri/card0`.
3.  **Cross-Compilation:**
    *   Build on a powerful machine using `cross` for the `arm-unknown-linux-gnueabihf` target.
4.  **Systemd Integration:**
    ```ini
    [Unit]
    Description=Solunar Globe Clock Native
    After=network.target

    [Service]
    ExecStart=/usr/local/bin/solunar-clock
    Restart=always
    User=pi

    [Install]
    WantedBy=multi-user.target
    ```
5.  **Advantages:**
    *   **RAM:** < 40MB (vs ~250MB for Chromium).
    *   **Boot Time:** < 5 seconds to clock face.
    *   **Thermal:** Significant reduction in CPU load compared to JIT-compiled JavaScript.
