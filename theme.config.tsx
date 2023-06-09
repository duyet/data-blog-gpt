import type { DocsThemeConfig } from 'nextra-theme-docs'

import { useRouter } from 'next/router'
import { useConfig } from 'nextra-theme-docs'

const theme: DocsThemeConfig = {
  logo: <span>Data Engineering Blog by GPT-3</span>,
  head: () => {
    const { asPath, defaultLocale, locale } = useRouter()
    const { frontMatter } = useConfig()
    const url =
      'https://data-blog-gpt.vercel.app' +
      (defaultLocale === locale ? asPath : `/${locale}${asPath}`)
    const title = frontMatter.title || 'Data Engineering Blog by GPT-3'
    const description =
      frontMatter.description ||
      'Welcome to Data Engineering Blog by GPT-3, where all the content is generated by OpenAI GPT-3.5'

    return (
      <>
        <meta property='og:url' content={url} />
        <meta property='og:title' content={title} />
        <meta property='og:description' content={description} />
      </>
    )
  },
  footer: {
    text: `© ${new Date().getFullYear()} Data Engineering Blog by GPT-3`,
  },
  sidebar: {
      defaultMenuCollapseLevel: 1
    },
  gitTimestamp: ({ timestamp }) => (
    <span>Last updated: {timestamp.toString()}</span>
  ),
  project: {
    link: 'https://github.com/duyet/data-blog-gpt',
  },
  docsRepositoryBase:
    'https://github.com/duyet/data-blog-gpt/blob/master/pages',
}

export default theme
