import { addDOMDynamicAttributes, updateDOMDynamicAttributes, clearListeners } from '../addAttributes';
import { VOID_NODE, STATIC_NODE } from '../bits';

export default function createVoidNode(templateNode, dynamicAttrs) {
	const domNodeMap = {};
	const node = {
		overrideItem: null,
		create(item) {

			if (templateNode.type === STATIC_NODE) {
				return templateNode.node.cloneNode(true);
			}

			const domNode = templateNode.node.cloneNode(true);

			if (dynamicAttrs) {
				addDOMDynamicAttributes(item, domNode, dynamicAttrs, null);
			}
			domNodeMap[item.id] = domNode;
			return domNode;
		},
		update(lastItem, nextItem) {
			const domNode = domNodeMap[lastItem.id];

			if (dynamicAttrs) {
				updateDOMDynamicAttributes(lastItem, nextItem, domNode, dynamicAttrs);
			}
		},
		remove(item) {
			if ( templateNode.type === VOID_NODE) {
				const domNode = domNodeMap[item.id];

				if (dynamicAttrs) {
					clearListeners(item, domNode, dynamicAttrs);
				}

			}
		},
		hydrate() {}
	};

	return node;
}
