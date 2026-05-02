import { MarkdownToStorageConverter } from '../../../../tools/confluence/converters/md-to-storage.js';
import { StorageToMarkdownConverter } from '../../../../tools/confluence/converters/storage-to-md.js';
import { createConfluenceClient } from '../../../../tools/confluence/api/client.js';
import { ConfluenceContentApi } from '../../../../tools/confluence/api/content.js';

export async function uploadMarkdown(
  baseUrl: string, 
  email: string, 
  token: string, 
  spaceKey: string,
  title: string,
  markdown: string, 
  pageId?: string
) {
  const converter = new MarkdownToStorageConverter({ baseUrl });
  const storageXml = await converter.convert(markdown);
  
  const axiosClient = createConfluenceClient({
    baseUrl,
    auth: { username: email || undefined, token }
  });
  
  const contentApi = new ConfluenceContentApi(axiosClient);

  if (pageId) {
    const page = await contentApi.getPage(pageId);
    return await contentApi.updatePage({ id: pageId, version: page.version.number, title, body: storageXml });
  } else {
    return await contentApi.createPage({ spaceKey, title, body: storageXml });
  }
}

export async function downloadPage(
  baseUrl: string, 
  email: string, 
  token: string, 
  pageId: string
) {
  const axiosClient = createConfluenceClient({
    baseUrl,
    auth: { username: email || undefined, token }
  });
  
  const contentApi = new ConfluenceContentApi(axiosClient);

  const page = await contentApi.getPage(pageId);
  const converter = new StorageToMarkdownConverter({ baseUrl });
  const markdown = await converter.convert(page.body.storage.value);
  
  return { title: page.title, markdown };
}
