import React from 'react';
import { Seo, type SeoProps } from './Seo';

export type PageSEOProps = SeoProps;

export function PageSEO(props: PageSEOProps) {
  return <Seo {...props} />;
}
