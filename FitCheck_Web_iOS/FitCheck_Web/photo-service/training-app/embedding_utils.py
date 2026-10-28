"""Helpers for working with FashionCLIP image embeddings."""
import torch


def normalized_image_features(model, inputs):
    """Return normalized image embeddings across Transformers API versions."""
    output = model.get_image_features(**inputs)

    # Newer Transformers versions return a model-output object; older versions
    # returned the projected feature tensor directly.
    if hasattr(output, "pooler_output"):
        embedding = output.pooler_output
    elif isinstance(output, tuple):
        embedding = output[0]
    else:
        embedding = output

    if not isinstance(embedding, torch.Tensor):
        raise TypeError(
            "Expected FashionCLIP image features to be a tensor, got "
            f"{type(embedding).__name__}."
        )

    norm = embedding.norm(dim=-1, keepdim=True).clamp_min(torch.finfo(embedding.dtype).eps)
    return embedding / norm
