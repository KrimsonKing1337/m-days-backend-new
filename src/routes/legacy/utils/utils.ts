import type { ParsedQs } from 'qs';
import qs from 'qs';

import { nanoid } from 'nanoid';

export function getAttrsForRender(query: ParsedQs) {
  // mr = metaRefresh
  const { mr = '30' } = query;

  const queryString = qs.stringify(query);

  const uuid = nanoid();

  let bgImgSrc = `/l-slide_${uuid}.jpg`;

  if (queryString) {
    bgImgSrc += `?${queryString}`;
  }

  return {
    bgImgSrc,
    metaRefresh: mr,
  };
}
