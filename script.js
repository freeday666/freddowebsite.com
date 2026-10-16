
document.querySelectorAll("[data-copy]").forEach((button) => {
  button.addEventListener("click", async () => {
    const value = button.dataset.copy;

    try {
      await navigator.clipboard.writeText(value);
      const originalText = button.textContent;
      button.textContent = "Gekopieerd!";
      setTimeout(() => {
        button.textContent = originalText;
      }, 1200);
    } catch (error) {
      window.prompt("Kopieer deze tekst:", value);
    }
  });
});