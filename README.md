# awesome-find

A beautiful, powerful, and efficient Chrome extension for searching text on a page.

> This extension is inspired by the Chrome extension [findwhatever](https://github.com/ImSwordTooth/findwhatever). I used it daily but found its features, UI, and implementation didn't match my preferences, so I created **awesome-find**. If you want a lightweight, high-performance search tool, try **awesome-find**. If you need to search across all iframes and observe DOM mutations, **findwhatever** may be a better fit.

---

## Features

- Case-sensitive, whole-word, and regular-expression (regex) search modes.
- Search history with hover preview and quick research.
- Pin frequently used searches for quick access.
- Copy matched text directly in regex mode.
## Example
Search on https://vite.dev/
![alt text](image.png)

## Technology stack

-   ⚡️ **React 19** - Latest React with new features
-   🏗️ **TypeScript** - Full type safety
-   ⚡️ **Vite** - Fast build tool and development server
-   🎨 **TailwindCSS** - Utility-first CSS framework
-   📦 **CRXJS** - Vite plugin for Chrome extension development
-   🧩 **Manifest V3** - Latest Chrome extension manifest

## Getting Started

1. **Install dependencies**

    ```bash
    pnpm install
    ```

2. **Start development**

    ```bash
    pnpm dev
    ```

3. **Load extension in Chrome**

    - Open Chrome and navigate to `chrome://extensions/`
    - Enable "Developer mode" in the top right
    - Click "Load unpacked"
    - Select the `dist` folder from your project

4. **Build for production**
    ```bash
    pnpm build
    ```

**_I'm very happy to see you submit a PR to make it better._**

## License

[GPL-3.0-only](LICENSE)
