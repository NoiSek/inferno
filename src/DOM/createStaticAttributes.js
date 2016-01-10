import isVoid from '../util/isVoid';
import { addDOMStaticAttributes } from './addAttributes';

function createStaticAttributes(node, domNode, excludeAttrs) {

	const { attrs } = node;

	if (!isVoid(attrs)) {
		if (excludeAttrs) {
			const newAttrs = { ...attrs };

			for (const attr in excludeAttrs) {
				if (newAttrs[attr]) {
					delete newAttrs[attr];
				}
			}
			addDOMStaticAttributes(node, domNode, newAttrs);
		} else {
			addDOMStaticAttributes(node, domNode, attrs);
		}
	}
}
export default createStaticAttributes;