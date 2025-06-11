from typing import Text, Optional, Dict, Any
from rasa.core.channels.rest import RestOutput
from rasa.shared.core.trackers import DialogueStateTracker

class MessageTrackingOutputChannel(RestOutput):
    @classmethod
    def name(cls) -> Text:
        return "message_tracking_rest"

    async def send_response(
        self,
        recipient_id: Text,
        message: Dict[Text, Any],
        **kwargs: Any,
    ) -> None:
        tracker: Optional[DialogueStateTracker] = kwargs.get("tracker")

        message_id = None
        if tracker and tracker.latest_message:
            message_id = tracker.latest_message.metadata.get("message_id")

        if message_id:
            message.setdefault("metadata", {})["message_id"] = message_id

        await super().send_response(recipient_id, message, **kwargs)
