export const copyText = (text: string) => {
  const tempInput = document.createElement("input");
  tempInput.value = text;
  document.body.appendChild(tempInput);
  tempInput.focus();
  tempInput.select();
  document.execCommand("copy");
  document.body.removeChild(tempInput);
};