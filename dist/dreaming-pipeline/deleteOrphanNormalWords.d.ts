export type DeleteOrphanNormalWordsResult = {
    count: number;
    ids: number[];
};
/**
 * 删除「无 word_to_normal_link 且无 sentence_to_normal_link」的 normal_words。
 * 仅有句子边（仅有 sentence_to_normal_link）或仍有词锚定（word_to_normal_link）的均保留。
 */
export declare function deleteOrphanNormalWords(dbPath: string): DeleteOrphanNormalWordsResult;
