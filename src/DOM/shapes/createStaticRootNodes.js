import { recycle } from '../recycling';
import { addDOMDynamicAttributes, updateDOMDynamicAttributes, clearListeners } from '../addAttributes';
import recreateRootNode, { recreateRootNodeFromHydration } from '../recreateRootNode';
import { validateHydrateNode } from '../hydration';
import { ROOT_STATIC_CHILD, ROOT_STATIC_NODE, ROOT_VOID_NODE } from '../bits';

function createRootNodes(templateNode, dynamicAttrs, recyclingEnabled) {

	const node = {
		pool: [],
		keyedPool: [],
		overrideItem: null,
		create(item) {
			let domNode;

			if (recyclingEnabled) {
				domNode = recycle(node, item);
				if (domNode) {
					return domNode;
				}
			}
			domNode = templateNode.node.cloneNode(true);
			item.rootNode = domNode;

			switch (templateNode.type) {

				case ROOT_STATIC_CHILD:
				case ROOT_VOID_NODE:

					if (dynamicAttrs) {
						addDOMDynamicAttributes(item, domNode, dynamicAttrs, node);
					}
					break;
			}
			return domNode;
		},
		update(lastItem, nextItem, treeLifecycle) {
			if (node !== lastItem.tree.dom) {
				recreateRootNode(lastItem, nextItem, node, treeLifecycle);
				return;
			}

			switch (templateNode.type) {

				case ROOT_VOID_NODE:
				case ROOT_STATIC_CHILD:
					const domNode = lastItem.rootNode;

					nextItem.rootNode = domNode;
					nextItem.id = lastItem.id;
					if (dynamicAttrs) {
						updateDOMDynamicAttributes(lastItem, nextItem, domNode, dynamicAttrs);
					}
					break;
				case ROOT_STATIC_NODE:

					nextItem.rootNode = lastItem.rootNode;
					break;
			}
		},
		remove(item) {

			switch (templateNode.type) {
				case ROOT_STATIC_CHILD: break;
				case ROOT_VOID_NODE:

					if (dynamicAttrs) {
						clearListeners(item, item.rootNode, dynamicAttrs);
					}
				break;
			}



		},
		hydrate(hydrateNode, item) {
			switch (templateNode.type) {
				case ROOT_STATIC_NODE:

					if (!validateHydrateNode(hydrateNode, templateNode.node, item)) {
						recreateRootNodeFromHydration(hydrateNode, item, node);
						return;
					}
					item.rootNode = hydrateNode;

					break;
			}
		}
	};

	return node;
}

export default createRootNodes;