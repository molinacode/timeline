// src/types/rss.d.ts
declare module 'rss-parser' {
  class Parser<T = any> {
    constructor(options?: Parser.Options);
    parseString(xml: string, callback?: (err: Error | null, result: Parser.Output<T>) => void): Promise<Parser.Output<T>>;
    parseURL(url: string, callback?: (err: Error | null, result: Parser.Output<T>) => void): Promise<Parser.Output<T>>;
  }

  namespace Parser {
    interface Options {
      [key: string]: any;
    }

    interface Output<T = any> {
      title: string;
      description: string;
      date: Date | null;
      pubdate: Date | null;
      author: string;
      items: Item<T>[];
    }

    interface Item<T = any> {
      title: string;
      description: string;
      date: Date | null;
      pubdate: Date | null;
      author: string;
      guid: string;
      url: string;
      content: string;
      contentSnippet: string;
      categories: string[];
      [key: string]: any;
    }
  }

  export = Parser;
}