export default {
  lineItems: (order) => {
    const actions = []

    order.lineItems.forEach((lineItem) => {
      if (lineItem.state)
        lineItem.state.forEach((state) => {
          if (state.fromState && state.toState) {
            const action = {
              action: 'transitionLineItemState',
              lineItemId: lineItem.id,
              quantity: state.quantity,
              fromState: state.fromState,
              toState: state.toState,
            }

            // Check for optional fields
            if (state.actualTransitionDate)
              action.actualTransitionDate = state.actualTransitionDate

            actions.push(action)
          }
        })
    })

    return actions
  },

  customLineItems: (order) => {
    const actions = []

    order.customLineItems.forEach((lineItem) => {
      if (lineItem.state)
        lineItem.state.forEach((state) => {
          if (state.fromState && state.toState) {
            const action = {
              action: 'transitionCustomLineItemState',
              customLineItemId: lineItem.id,
              quantity: state.quantity,
              fromState: state.fromState,
              toState: state.toState,
            }

            // Check for optional fields
            if (state.actualTransitionDate)
              action.actualTransitionDate = state.actualTransitionDate

            actions.push(action)
          }
        })
    })

    return actions
  },
}
