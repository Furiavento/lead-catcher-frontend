import { HEIGHT_MESSAGE } from '../public-form/embed';

/** URL of the public form for a source, e.g. `https://panel.x/f/landing-verano`. */
export function formUrl(origin: string, source: string): string {
  return `${origin}/f/${encodeURIComponent(source.trim() || 'web')}`;
}

/**
 * Code to paste in a landing page. It forwards the page's UTM parameters and
 * URL to the form (they live on the landing page, not on the iframe) and
 * resizes the iframe to the form's height.
 */
export function embedSnippet(url: string): string {
  return `<div id="lead-catcher-form"></div>
<script>
  (function () {
    var src = new URL(${JSON.stringify(url)});
    new URL(location.href).searchParams.forEach(function (value, key) {
      if (key.indexOf('utm_') === 0) src.searchParams.set(key, value);
    });
    src.searchParams.set('landing', location.href);
    var frame = document.createElement('iframe');
    frame.src = src.href;
    frame.title = 'Formulario de contacto';
    frame.style.cssText = 'width:100%;height:640px;border:0';
    window.addEventListener('message', function (event) {
      if (event.source === frame.contentWindow && event.data && event.data.type === ${JSON.stringify(HEIGHT_MESSAGE)}) {
        frame.style.height = event.data.height + 'px';
      }
    });
    document.getElementById('lead-catcher-form').appendChild(frame);
  })();
</script>`;
}

/** Direct API call, for developers sending leads from their own backend. */
export function apiExample(apiUrl: string, source: string): string {
  const body = {
    name: 'Ana García',
    email: 'ana@example.com',
    phone: '+34 600 000 000',
    message: 'Quiero más información',
    source: source.trim() || 'web',
    consent: true,
    privacyPolicyVersion: '2026-01',
  };
  return `POST ${apiUrl}/leads
Content-Type: application/json

${JSON.stringify(body, null, 2)}`;
}
