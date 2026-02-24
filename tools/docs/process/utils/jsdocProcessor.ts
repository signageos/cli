import * as ts from 'typescript';
import type { JSDocInfo, LinkInfo, ThrowsInfo, ParameterInfo } from '../../core/domain-types.js';
import { extractCommentText } from '../../utils/shared.js';

/**
 * Helper function to find all tags with a specific name across all JSDoc nodes
 */
function findTagsByName(jsDocNodes: ts.JSDoc[], tagName: string): ts.JSDocTag[] {
	const matchingTags: ts.JSDocTag[] = [];
	for (const jsDocNode of jsDocNodes) {
		if (jsDocNode.tags) {
			for (const tag of jsDocNode.tags) {
				if (tag.tagName.getText() === tagName) {
					matchingTags.push(tag);
				}
			}
		}
	}
	return matchingTags;
}

/**
 * Extracts comprehensive JSDoc information from TypeScript AST nodes
 */
export function extractJSDoc(node: ts.Node): JSDocInfo | null {
	// Use TypeScript's built-in JSDoc extraction
	const jsDocNodes = ts.getJSDocCommentsAndTags(node).filter(ts.isJSDoc);

	if (jsDocNodes.length === 0) {
		return null;
	}

	return {
		longDescription: extractLongDescription(jsDocNodes),
		examples: extractExamples(jsDocNodes),
		see: extractSeeLinks(jsDocNodes),
		remarks: extractRemarks(jsDocNodes),
		since: extractSince(jsDocNodes),
		deprecated: extractDeprecated(jsDocNodes),
		author: extractAuthor(jsDocNodes),
		version: extractVersion(jsDocNodes),
		group: extractGroup(jsDocNodes),
		groupPriority: extractGroupPriority(jsDocNodes),
		throws: extractThrows(jsDocNodes),
		tags: extractTags(jsDocNodes),
	};
}

function extractLongDescription(jsDocNodes: ts.JSDoc[]): string {
	for (const jsDocNode of jsDocNodes) {
		if (jsDocNode.comment) {
			return extractCommentText(jsDocNode.comment);
		}
	}
	return '';
}

function extractExamples(jsDocNodes: ts.JSDoc[]): string {
	const tags = findTagsByName(jsDocNodes, 'example');
	return tags[0] ? extractCommentText(tags[0].comment) : '';
}

function extractSeeLinks(jsDocNodes: ts.JSDoc[]): LinkInfo[] {
	const seeTags = findTagsByName(jsDocNodes, 'see');
	const seeLinks: LinkInfo[] = [];

	for (const tag of seeTags) {
		const seeInfo = processSeeTag(tag);
		if (seeInfo) {
			seeLinks.push(seeInfo);
		}
	}

	return seeLinks;
}

function extractRemarks(jsDocNodes: ts.JSDoc[]): string {
	const tags = findTagsByName(jsDocNodes, 'remarks');
	return tags[0] ? extractCommentText(tags[0].comment) : '';
}

function extractSince(jsDocNodes: ts.JSDoc[]): string {
	const tags = findTagsByName(jsDocNodes, 'since');
	return tags[0] ? extractCommentText(tags[0].comment) : '';
}

function extractDeprecated(jsDocNodes: ts.JSDoc[]): string {
	const tags = findTagsByName(jsDocNodes, 'deprecated');
	if (tags[0]) {
		const comment = extractCommentText(tags[0].comment);
		return comment || 'This command is deprecated';
	}
	return '';
}

function extractAuthor(jsDocNodes: ts.JSDoc[]): string {
	const tags = findTagsByName(jsDocNodes, 'author');
	return tags[0] ? extractCommentText(tags[0].comment) : '';
}

function extractVersion(jsDocNodes: ts.JSDoc[]): string {
	const tags = findTagsByName(jsDocNodes, 'version');
	return tags[0] ? extractCommentText(tags[0].comment) : '';
}

/**
 * Extracts group name from @group tag format: "groupName:priority"
 */
function extractGroup(jsDocNodes: ts.JSDoc[]): string | undefined {
	const tags = findTagsByName(jsDocNodes, 'group');
	if (tags[0]) {
		const comment = extractCommentText(tags[0].comment);
		const groupParts = comment.split(':');
		return groupParts[0]?.trim();
	}
	return undefined;
}

/**
 * Extracts numeric priority from @group tag format: "groupName:priority"
 */
function extractGroupPriority(jsDocNodes: ts.JSDoc[]): number | undefined {
	const tags = findTagsByName(jsDocNodes, 'group');
	if (tags[0]) {
		return parsePriorityFromGroupTag(tags[0]);
	}
	return undefined;
}

function parsePriorityFromGroupTag(tag: ts.JSDocTag): number | undefined {
	const comment = extractCommentText(tag.comment);
	const groupParts = comment.split(':');

	if (groupParts.length === 2) {
		const priority = Number.parseInt(groupParts[1]?.trim() || '', 10);
		if (!isNaN(priority)) {
			return priority;
		}
	}
	return undefined;
}

function extractThrows(jsDocNodes: ts.JSDoc[]): ThrowsInfo[] {
	const throwsTags = findTagsByName(jsDocNodes, 'throws');
	const throws: ThrowsInfo[] = [];

	for (const tag of throwsTags) {
		if (ts.isJSDocThrowsTag(tag)) {
			throws.push(...processThrowsTag(tag));
		}
	}

	return throws;
}

/**
 * Extracts custom tags and @param tags, excluding standard JSDoc tags
 */
function extractTags(jsDocNodes: ts.JSDoc[]): Record<string, unknown> {
	const tags: Record<string, unknown> = {};
	const knownTags = new Set(['example', 'see', 'remarks', 'since', 'deprecated', 'author', 'version', 'group', 'throws']);

	for (const jsDocNode of jsDocNodes) {
		if (jsDocNode.tags) {
			processTagsFromNode(jsDocNode.tags, tags, knownTags);
		}
	}

	return tags;
}

function processTagsFromNode(tags: readonly ts.JSDocTag[], tagMap: Record<string, unknown>, knownTags: Set<string>): void {
	for (const tag of tags) {
		const tagName = tag.tagName.getText();
		processIndividualTag(tag, tagName, tagMap, knownTags);
	}
}

function processIndividualTag(tag: ts.JSDocTag, tagName: string, tagMap: Record<string, unknown>, knownTags: Set<string>): void {
	if (tagName === 'param') {
		processParamTag(tag, tagMap);
	} else if (!knownTags.has(tagName)) {
		tagMap[tagName] = extractCommentText(tag.comment);
	}
}

function processParamTag(tag: ts.JSDocTag, tagMap: Record<string, unknown>): void {
	if (ts.isJSDocParameterTag(tag)) {
		if (!tagMap.param) {
			tagMap.param = [];
		}
		(tagMap.param as ParameterInfo[]).push(processParameterTag(tag));
	}
}

function processParameterTag(tag: ts.JSDocParameterTag): ParameterInfo {
	return {
		name: tag.name ? tag.name.getText() : '',
		type: tag.typeExpression ? tag.typeExpression.getText() : '',
		description: extractCommentText(tag.comment),
	};
}

function processThrowsTag(tag: ts.JSDocThrowsTag): ThrowsInfo[] {
	return [
		{
			type: tag.typeExpression ? tag.typeExpression.getText() : 'Error',
			description: extractCommentText(tag.comment),
		},
	];
}

/**
 * Parses @see tags supporting {@link url} format and reconstructed URLs.
 * Accepts: ./path, ../path, https://url
 */
function processSeeTag(tag: ts.JSDocTag): LinkInfo | null {
	if (!tag.comment) {
		return null;
	}

	// Extract the full comment text (reconstructed URLs handled in extractCommentText)
	const rawComment = extractCommentText(tag.comment);

	if (!rawComment) {
		return null;
	}

	// First try the original {@link url} format
	const linkMatch = /\{@link\s+([^\s}]+)(?:\s+([^}]*))?\}/.exec(rawComment);

	if (linkMatch) {
		const url = linkMatch[1]?.trim();
		const description = linkMatch[2]?.trim() || '';

		// Validate URL format - only allow the three clear states
		if (url && isValidUrlFormat(url)) {
			return {
				url: url,
				text: description || url,
			};
		}
	}

	// Handle TypeScript-parsed format: "url text"
	const parts = rawComment.trim().split(/\s+/);

	if (parts.length >= 1) {
		let url = parts[0];
		if (!url) {
			return null;
		}

		const text = parts.slice(1).join(' ').trim();

		// Handle URLs that start with :// (originally https://)
		if (url.startsWith('://')) {
			url = 'https' + url;
		}

		// Validate the final URL format
		if (isValidUrlFormat(url)) {
			return {
				url: url,
				text: text || url,
			};
		}
	}

	// No valid format found
	return null;
}

/**
 * Validates URL formats: ./path, ../path, or https://url only
 */
function isValidUrlFormat(url: string): boolean {
	// State 1: Relative to current directory
	if (url.startsWith('./')) {
		return true;
	}

	// State 2: Relative to parent directory
	if (url.startsWith('../')) {
		return true;
	}

	// State 3: Absolute external URL
	if (url.startsWith('https://') || url.startsWith('http://')) {
		return true;
	}

	// Reject ambiguous formats like bare "upload/" or "run/"
	return false;
}
