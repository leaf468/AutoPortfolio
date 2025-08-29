declare module 'mustache' {
  interface MustacheStatic {
    render(template: string, data: any, partials?: any): string;
  }
  
  const mustache: MustacheStatic;
  export = mustache;
}