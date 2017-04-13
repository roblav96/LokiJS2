import {FullTextSearch} from './full_text_search';
import {Tokenizer} from './tokenizer';
import {QueryBuilder} from './queries';
import Loki from 'Loki';

Loki.Tokenizer = Tokenizer;
Loki.QueryBuilder = QueryBuilder;
Loki.Plugins.FullTextSearch = FullTextSearch;

