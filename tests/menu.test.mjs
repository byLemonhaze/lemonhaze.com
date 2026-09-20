import test from "node:test";
import assert from "node:assert/strict";

import { closeMobileSidebar, toggleMobileSidebar } from "../src/ui/menu.js";

function createClassList(initialClasses = []) {
  const classes = new Set(initialClasses);

  return {
    add(className) {
      classes.add(className);
    },
    remove(className) {
      classes.delete(className);
    },
    toggle(className) {
      if (classes.has(className)) {
        classes.delete(className);
        return false;
      }
      classes.add(className);
      return true;
    },
    contains(className) {
      return classes.has(className);
    },
  };
}

function createMenuRefs({ isOpen = false } = {}) {
  const menuButton = {
    attributes: new Map(),
    setAttribute(name, value) { this.attributes.set(name, value); },
    getAttribute(name) { return this.attributes.get(name); },
  };
  const sidebar = {
    ownerDocument: { getElementById: id => id === "menu-toggle" ? menuButton : null },
    classList: createClassList(isOpen ? [] : ["-translate-x-full"]),
  };
  const backdrop = {
    classList: createClassList(isOpen ? [] : ["hidden"]),
  };

  return {
    appState: { isMobileMenuOpen: isOpen },
    sidebar,
    menuButton,
    backdrop,
    mobileBackdrop: () => backdrop,
  };
}

test("toggleMobileSidebar opens and closes the mobile sidebar state", () => {
  const refs = createMenuRefs({ isOpen: false });

  toggleMobileSidebar(refs);
  assert.equal(refs.appState.isMobileMenuOpen, true);
  assert.equal(refs.menuButton.getAttribute("aria-expanded"), "true");
  assert.equal(refs.menuButton.getAttribute("aria-label"), "Close navigation");
  assert.equal(refs.sidebar.classList.contains("-translate-x-full"), false);
  assert.equal(refs.backdrop.classList.contains("hidden"), false);

  toggleMobileSidebar(refs);
  assert.equal(refs.appState.isMobileMenuOpen, false);
  assert.equal(refs.menuButton.getAttribute("aria-expanded"), "false");
  assert.equal(refs.menuButton.getAttribute("aria-label"), "Open navigation");
  assert.equal(refs.sidebar.classList.contains("-translate-x-full"), true);
  assert.equal(refs.backdrop.classList.contains("hidden"), true);
});

test("closeMobileSidebar hides the sidebar without relying on toggle state", () => {
  const refs = createMenuRefs({ isOpen: true });

  closeMobileSidebar(refs);
  assert.equal(refs.appState.isMobileMenuOpen, false);
  assert.equal(refs.menuButton.getAttribute("aria-expanded"), "false");
  assert.equal(refs.menuButton.getAttribute("aria-label"), "Open navigation");
  assert.equal(refs.sidebar.classList.contains("-translate-x-full"), true);
  assert.equal(refs.backdrop.classList.contains("hidden"), true);
});
