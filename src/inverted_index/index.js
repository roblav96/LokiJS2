import {FullTextSearch} from './full_text_search';
import {Tokenizer} from './tokenizer';
import {QueryBuilder} from './queries'
import {Loki} from '../core/loki';

Loki.Tokenizer = Tokenizer;
Loki.Plugins.FullTextSearch = FullTextSearch;
Loki.QueryBuilder = QueryBuilder;

class ABC {

};

export {ABC};
