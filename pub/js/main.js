document.addEventListener('DOMContentLoaded', () => {
    const form = document.querySelector('#url-form');
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      const url = form.elements.url.value;
      
      const response = await fetch('/shorten', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ url })
      });
  
      const data = await response.json();
  
      document.getElementById("shortUrlDisplay").innerHTML = `Your Short URL is: <span id="shortUrlCopy">https://ldkn.in/${data.shortUrl}</span><span id="copySymbol">&#x1F4CB;</span>`;
  
      document.getElementById("shortUrlCopy").addEventListener("click", function() {
          const urlToCopy = this.innerText;
          navigator.clipboard.writeText(urlToCopy).then(function() {
            document.getElementById("shortUrlDisplay").insertAdjacentHTML('beforeend', '<div id="msg-copied">Short URL copied to clipboard</div>');
          }).catch(function(err) {
            console.log('Could not copy text: ', err);
          });
          
      });
    });
  
  });