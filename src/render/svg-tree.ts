// A tiny SVG element tree, so the renderer can produce a string (servers, export) or DOM elements (the editor) from
// the same drawing.

export interface SvgNode {
  tag: string;
  attrs: Record<string, string | number>;
  children: SvgNode[];
  text?: string;
}

export const SVG_NS = "http://www.w3.org/2000/svg";

export function el(tag: string, attrs: Record<string, string | number | null | undefined> = {}, children: SvgNode[] = [], text?: string): SvgNode {
  const clean: Record<string, string | number> = {};
  for (const [key, value] of Object.entries(attrs)) if (value !== null && value !== undefined) clean[key] = value;
  return { tag, attrs: clean, children, text };
}

const escape = (text: string): string =>
  text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

/** Numbers without float noise: 27.000000000000004 -> "27". */
const format = (value: string | number): string => (typeof value === "number" ? String(Math.round(value * 1000) / 1000) : value);

export function toSvgString(node: SvgNode, indent = ""): string {
  const attrs = Object.entries(node.attrs).map(([key, value]) => ` ${key}="${escape(format(value))}"`).join("");
  if (node.text !== undefined) return `${indent}<${node.tag}${attrs}>${escape(node.text)}</${node.tag}>`;
  if (!node.children.length) return `${indent}<${node.tag}${attrs}/>`;
  const inner = node.children.map((child) => toSvgString(child, indent + "  ")).join("\n");
  return `${indent}<${node.tag}${attrs}>\n${inner}\n${indent}</${node.tag}>`;
}

export function toSvgElement(node: SvgNode, document: Document): SVGElement {
  const element = document.createElementNS(SVG_NS, node.tag) as SVGElement;
  for (const [key, value] of Object.entries(node.attrs)) element.setAttribute(key, format(value));
  if (node.text !== undefined) element.textContent = node.text;
  for (const child of node.children) element.appendChild(toSvgElement(child, document));
  return element;
}
