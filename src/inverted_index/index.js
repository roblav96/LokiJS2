import {FullTextSearch} from './full_text_search';
import {Plugin} from '../plugin';
import {Tokenizer} from './tokenizer';

Plugin.register("FullTextSearch", FullTextSearch);
Plugin.register("Tokenizer", Tokenizer, true);

module.exports = FullTextSearch;
