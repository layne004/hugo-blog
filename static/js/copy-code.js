document.addEventListener('DOMContentLoaded', () => {
    document.querySelectorAll('pre').forEach(pre => {

        const button = document.createElement('button');

        button.innerText = 'copy';

        button.className = 'copy-btn';

        button.onclick = async () => {

            const code = pre.querySelector('code');

            await navigator.clipboard.writeText(
                code.textContent
            );

            button.innerText = 'copied';

            setTimeout(() => {
                button.innerText = 'copy';
            }, 1500);
        };

        pre.appendChild(button);
    });
});