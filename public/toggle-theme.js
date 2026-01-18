const handleToggleClick = () => {
  const currentTheme = document.documentElement.getAttribute("data-theme");
  const newTheme = currentTheme === "light" ? "dark" : "light";

  document.documentElement.setAttribute("data-theme", newTheme);
  document.querySelector("#theme-btn")?.setAttribute("aria-label", newTheme);
  localStorage.setItem("theme", newTheme);

  const bgColor = window.getComputedStyle(document.body).backgroundColor;
  document.querySelector("meta[name='theme-color']")?.setAttribute("content", bgColor);
};

const setupToggle = () => {
  const toggle = document.querySelector("#theme-btn");
  if (toggle) {
    toggle.removeEventListener("click", handleToggleClick);
    toggle.addEventListener("click", handleToggleClick);
  }
};

document.addEventListener("astro:page-load", setupToggle);

window.matchMedia("(prefers-color-scheme: dark)").addEventListener("change", (e) => {
  if (!localStorage.getItem("theme")) {
    const newTheme = e.matches ? "dark" : "light";
    document.documentElement.setAttribute("data-theme", newTheme);
  }
});
