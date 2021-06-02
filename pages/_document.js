import React from 'react';
import Document, { Html, Head, Main, NextScript } from 'next/document';
import { ServerStyleSheets } from '@material-ui/core/styles';
import theme from '../app/components/theme';


export default class MyDocument extends Document {
  render() {
    return (
      <Html lang="en">
        <Head>
          {/* PWA primary color */}
          <meta name="theme-color" content={theme.palette.primary.main} />
          <meta property="og:title" content="Prejudice free" />
          <meta property="og:description" content="Where do you stand?" />
          <meta property="og:image" content="https://prejudicefree.com/thumb01.jpg" />
          <meta property="og:url" content="https://prejudicefree.com" />
          <meta name="twitter:card" content="summary_large_image" />

            <link
              rel="stylesheet"
              href="https://fonts.googleapis.com/css?family=Roboto:300,400,500,700&display=swap"
            />
            <script type='module' dangerouslySetInnerHTML={{
              // __html: `window.initAnalytics()`
              __html: `
              import analytics from 'https://unpkg.com/analytics/lib/analytics.browser.es.js?module'
              import analyticsGa from 'https://unpkg.com/@analytics/google-analytics/lib/analytics-plugin-ga.browser.es.js?module'
              /* Initialize analytics */
              const Analytics = analytics({
                app: 'prejudice-free',
                // debug: true,
                plugins: [
                  analyticsGa({
                    trackingId: '${process.env.NEXT_PUBLIC_GOOGLE_ANALYTICS}',
                    // debug: true,
                  })
                ]
              })

              /* Track a page view */
              Analytics.page()

              window.Analytics = Analytics;
            `
            }} />
        </Head>
          <body>
            <Main />
            <NextScript />
          </body>
      </Html>
    );
  }
}

// `getInitialProps` belongs to `_document` (instead of `_app`),
// it's compatible with server-side generation (SSG).
MyDocument.getInitialProps = async (ctx) => {
  // Resolution order
  //
  // On the server:
  // 1. app.getInitialProps
  // 2. page.getInitialProps
  // 3. document.getInitialProps
  // 4. app.render
  // 5. page.render
  // 6. document.render
  //
  // On the server with error:
  // 1. document.getInitialProps
  // 2. app.render
  // 3. page.render
  // 4. document.render
  //
  // On the client
  // 1. app.getInitialProps
  // 2. page.getInitialProps
  // 3. app.render
  // 4. page.render

  // Render app and page and get the context of the page with collected side effects.
  const sheets = new ServerStyleSheets();
  const originalRenderPage = ctx.renderPage;

  ctx.renderPage = () =>
    originalRenderPage({
          enhanceApp: (App) => (props) => sheets.collect(<App {...props} />),
    });

  const initialProps = await Document.getInitialProps(ctx);

  return {
          ...initialProps,
          // Styles fragment is rendered after the app and page rendering finish.
          styles: [...React.Children.toArray(initialProps.styles), sheets.getStyleElement()],
  };
};