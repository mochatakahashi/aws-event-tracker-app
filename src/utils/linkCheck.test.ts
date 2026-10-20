import { describe, expect, it } from 'vitest';
import { documentKind, socialLinkError } from './linkCheck';

describe('linkCheck', () => {
  it('social links must match the platform', () => {
    expect(socialLinkError('linkedIn', 'https://www.youtube.com/@me')).toMatch(/isn't a LinkedIn link/);
    expect(socialLinkError('linkedIn', 'linkedin.com/in/ana')).toBe('');
    expect(socialLinkError('linkedIn', 'https://ph.linkedin.com/in/ana')).toBe('');
    expect(socialLinkError('youtube', 'youtu.be/abc')).toBe('');
    expect(socialLinkError('facebook', 'https://evilfacebook.com/x')).toMatch(/isn't a Facebook/);
    expect(socialLinkError('facebook', 'https://facebook.com.evil.io/x')).toMatch(/isn't a Facebook/);
    expect(socialLinkError('github', 'javascript:alert(1)')).toMatch(/web link/);
    expect(socialLinkError('website', 'myblog.dev')).toBe('');
    expect(socialLinkError('website', 'not a link')).toMatch(/web link/);
    expect(socialLinkError('twitterX', '')).toBe('');
  });
  it('documents only from trusted services, with their kind', () => {
    expect(documentKind('https://docs.google.com/document/d/abc/edit')).toBe('Google Docs document');
    expect(documentKind('https://docs.google.com/presentation/d/abc')).toBe('Google Slides presentation');
    expect(documentKind('https://drive.google.com/file/d/abc/view')).toBe('Google Drive file');
    expect(documentKind('https://www.canva.com/design/abc/view')).toBe('Canva design');
    expect(documentKind('https://apc.sharepoint.com/:w:/r/sites/x/doc.docx')).toBe('Word document (SharePoint)');
    expect(documentKind('https://apc-my.sharepoint.com/:p:/g/personal/x')).toBe('PowerPoint presentation (SharePoint)');
    expect(documentKind('https://1drv.ms/w/s!abc')).toBe('OneDrive file');
    expect(documentKind('http://docs.google.com/document/d/abc')).toBeNull();
    expect(documentKind('https://bit.ly/abc')).toBeNull();
    expect(documentKind('https://docs.google.com.evil.io/document')).toBeNull();
    expect(documentKind('https://evil.io/canva.com')).toBeNull();
  });
});
