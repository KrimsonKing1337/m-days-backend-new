import querystring from 'querystring';
import { nanoid } from 'nanoid';

export function getAttrsForRender(query: any) {
  // mr = metaRefresh
  const { mr = '30' } = query;

  const queryString = querystring.stringify(query);

  // const ext = 'static' ? 'jpg' : 'gif';
  const ext = 'jpg';
  const id = nanoid();

  let bgImgSrc = `/l-bg_${id}.${ext}`;

  if (queryString) {
    bgImgSrc += `?${queryString}`;
  }

  return {
    bgImgSrc,
    metaRefresh: mr,
  };
}
