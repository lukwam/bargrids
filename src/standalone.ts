// The one-file build for a <script> tag: everything, including the hexword library, with the custom elements
// defined. The library's other exports are on window.BarGrids.

import { defineElements } from "./element/elements.js";

export * from "./index.js";

if (typeof window !== "undefined" && "customElements" in window) defineElements();
